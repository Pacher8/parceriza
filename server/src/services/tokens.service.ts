import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { creditarTokens, debitarTokens } from './token.service.js';
import type { ComprarTokensInput, SacarTokensInput } from '../schemas/tokens.schema.js';

// ── Packages ──────────────────────────────────────────────────────────────────

export const PACOTES = {
  '100':  { tokens: 100,  valorReais: 10.00,  descontoPercent: 0  },
  '500':  { tokens: 500,  valorReais: 45.00,  descontoPercent: 10 },
  '1000': { tokens: 1000, valorReais: 80.00,  descontoPercent: 20 },
  '5000': { tokens: 5000, valorReais: 350.00, descontoPercent: 30 },
} as const;

function getAsaas() {
  if (!env.ASAAS_API_KEY) {
    throw new HttpError(503, 'Asaas não configurado. Defina ASAAS_API_KEY para habilitar compras.');
  }
  return axios.create({
    baseURL: env.ASAAS_BASE_URL,
    headers: { access_token: env.ASAAS_API_KEY, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
}

// ── Extrato ───────────────────────────────────────────────────────────────────

export async function getExtrato(advogadoId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [transacoes, total] = await Promise.all([
    prisma.transacao.findMany({
      where: { advogadoId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, tipo: true, origem: true, quantidade: true, descricao: true, createdAt: true },
    }),
    prisma.transacao.count({ where: { advogadoId } }),
  ]);
  return { transacoes, total, page, pages: Math.ceil(total / limit) };
}

// ── Compra ────────────────────────────────────────────────────────────────────

export async function comprarTokens(advogadoId: string, input: ComprarTokensInput) {
  const pacote = PACOTES[input.pacote];
  const asaas = getAsaas();

  // Get or create Asaas customer for this lawyer
  const advogado = await prisma.advogado.findUniqueOrThrow({
    where: { id: advogadoId },
    select: { nome: true, email: true },
  });

  // Create PIX payment
  const externalRef = `PARCERIZA_TOKENS:${input.pacote}:${advogadoId}`;
  try {
    const paymentRes = await asaas.post('/payments', {
      customer: await ensureAsaasCustomer(advogadoId, advogado.nome, advogado.email, asaas),
      billingType: 'PIX',
      value: pacote.valorReais,
      dueDate: new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 10),
      description: `Compra ${pacote.tokens} tokens Parceriza`,
      externalReference: externalRef,
    });

    const paymentId = paymentRes.data.id;

    // Get PIX QR code
    let pixCopiaECola = '';
    let qrCodeBase64 = '';
    try {
      const pixRes = await asaas.get(`/payments/${paymentId}/pixQrCode`);
      pixCopiaECola = pixRes.data.payload ?? '';
      qrCodeBase64 = pixRes.data.encodedImage ?? '';
    } catch { /* PIX may take a moment */ }

    return {
      cobrancaId: paymentId,
      pixCopiaECola,
      qrCodeBase64,
      valor: pacote.valorReais,
      tokens: pacote.tokens,
      expiraEm: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new HttpError(422, `Asaas: ${err.response?.data?.errors?.[0]?.description ?? err.message}`);
    }
    throw err;
  }
}

async function ensureAsaasCustomer(
  advogadoId: string,
  nome: string,
  email: string,
  asaas: ReturnType<typeof axios.create>,
): Promise<string> {
  // Check if customer exists (search by name as approximation)
  try {
    const res = await asaas.get('/customers', { params: { name: nome, limit: 1 } });
    if (res.data.data?.length > 0) return res.data.data[0].id;
  } catch { /* fall through to create */ }

  const res = await asaas.post('/customers', {
    name: nome,
    email,
    externalReference: advogadoId,
  });
  return res.data.id;
}

// ── Webhook Asaas ─────────────────────────────────────────────────────────────

export async function processarWebhookAsaas(body: Record<string, unknown>) {
  const event = body.event as string;
  if (event !== 'PAYMENT_CONFIRMED' && event !== 'PAYMENT_RECEIVED') return { ok: true };

  const payment = body.payment as {
    id: string;
    externalReference: string;
    value: number;
    status: string;
  };

  if (!payment?.externalReference?.startsWith('PARCERIZA_TOKENS:')) return { ok: true };

  const parts = payment.externalReference.split(':');
  const pacoteKey = parts[1] as keyof typeof PACOTES;
  const advogadoId = parts[2];

  if (!PACOTES[pacoteKey] || !advogadoId) return { ok: true };

  // Idempotency: check if already processed
  const jaProcessado = await prisma.transacao.findFirst({
    where: { advogadoId, referenciaId: payment.id, tipo: 'CREDITO' },
  });
  if (jaProcessado) return { ok: true, message: 'já processado' };

  const pacote = PACOTES[pacoteKey];
  await creditarTokens(
    advogadoId,
    pacote.tokens,
    'COMPRA',
    `Compra de ${pacote.tokens} tokens via PIX`,
    payment.id,
  );

  return { ok: true, tokensCredits: pacote.tokens, advogadoId };
}

// ── Saque ─────────────────────────────────────────────────────────────────────

export async function solicitarSaque(advogadoId: string, input: SacarTokensInput) {
  const valorReais = input.quantidadeTokens * 0.10;

  await debitarTokens(
    advogadoId,
    input.quantidadeTokens,
    'REEMBOLSO',
    `Saque de ${input.quantidadeTokens} tokens (R$ ${valorReais.toFixed(2)})`,
  );

  return prisma.saqueToken.create({
    data: {
      advogadoId,
      quantidadeTokens: input.quantidadeTokens,
      valorReais,
      pixChave: input.pixChave,
      status: 'SOLICITADO',
    },
    select: { id: true, quantidadeTokens: true, valorReais: true, status: true, pixChave: true, createdAt: true },
  });
}

export async function listarSaques(advogadoId: string) {
  return prisma.saqueToken.findMany({
    where: { advogadoId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, quantidadeTokens: true, valorReais: true, status: true, pixChave: true, createdAt: true },
  });
}
