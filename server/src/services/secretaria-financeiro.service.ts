import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { CriarClienteAsaasInput, GerarCobrancaInput } from '../schemas/secretaria.schema.js';

function getAsaas() {
  if (!env.ASAAS_API_KEY) {
    throw new HttpError(503, 'Asaas não configurado. Defina ASAAS_API_KEY no .env.');
  }
  return axios.create({
    baseURL: env.ASAAS_BASE_URL,
    headers: {
      access_token: env.ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

export async function criarCliente(data: CriarClienteAsaasInput) {
  const asaas = getAsaas();
  try {
    const res = await asaas.post('/customers', {
      name: data.nome,
      cpfCnpj: data.cpfCnpj,
      email: data.email ?? undefined,
      phone: data.telefone ?? undefined,
    });
    return res.data as { id: string; name: string; cpfCnpj: string; email: string };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.errors?.[0]?.description ?? err.message;
      throw new HttpError(422, `Asaas: ${msg}`);
    }
    throw err;
  }
}

export async function gerarCobranca(data: GerarCobrancaInput) {
  const asaas = getAsaas();
  try {
    const res = await asaas.post('/payments', {
      customer: data.clienteAsaasId,
      billingType: data.tipo,
      value: data.valor,
      dueDate: data.vencimento,
      description: data.descricao ?? undefined,
    });
    const payment = res.data as {
      id: string; value: number; status: string; billingType: string;
      dueDate: string; invoiceUrl: string; bankSlipUrl: string | null;
    };

    let pixInfo = null;
    if (data.tipo === 'PIX') {
      try {
        const pixRes = await asaas.get(`/payments/${payment.id}/pixQrCode`);
        pixInfo = { qrCode: pixRes.data.payload, encodedImage: pixRes.data.encodedImage };
      } catch {
        // PIX QR pode não estar imediatamente disponível
      }
    }

    return { ...payment, pixInfo };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.errors?.[0]?.description ?? err.message;
      throw new HttpError(422, `Asaas: ${msg}`);
    }
    throw err;
  }
}

export async function listarCobrancas(params: { limit?: number; offset?: number } = {}) {
  const asaas = getAsaas();
  try {
    const res = await asaas.get('/payments', {
      params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
    });
    return res.data as {
      data: Array<{
        id: string; customer: string; value: number; status: string;
        billingType: string; dueDate: string; description: string | null;
      }>;
      totalCount: number;
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new HttpError(422, `Asaas: ${err.message}`);
    }
    throw err;
  }
}

export async function getCobranca(id: string) {
  const asaas = getAsaas();
  try {
    const res = await asaas.get(`/payments/${id}`);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) throw new HttpError(404, 'Cobrança não encontrada');
      throw new HttpError(422, `Asaas: ${err.message}`);
    }
    throw err;
  }
}

export async function getTabelaHonorarios(advogadoId: string) {
  const config = await prisma.financeiroConfig.findUnique({
    where: { advogadoId },
    select: { tabelaHonorarios: true, pixChave: true },
  });
  return {
    tabela: config?.tabelaHonorarios ? JSON.parse(config.tabelaHonorarios) : [],
    pixChave: config?.pixChave ?? null,
  };
}
