import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { creditarTokens } from './token.service.js';

const TOKENS_INDICACAO = 100;

function gerarCodigo(advogado: { oab: string; oabUf: string; id: string }): string {
  const base = `${advogado.oabUf}${advogado.oab}`.toUpperCase().replace(/\D/g, '');
  const suffix = advogado.id.slice(-4).toUpperCase();
  return `${base.slice(-6)}${suffix}`;
}

export async function getMeuCodigo(advogadoId: string) {
  const advogado = await prisma.advogado.findUniqueOrThrow({
    where: { id: advogadoId },
    select: { oab: true, oabUf: true, id: true },
  });

  const codigo = gerarCodigo(advogado);

  // Ensure IndicacaoToken record exists for this indicator
  await prisma.indicacaoToken.upsert({
    where: { codigoIndicacao: codigo },
    update: {},
    create: { indicadorId: advogadoId, codigoIndicacao: codigo, status: 'PENDENTE' },
  });

  const [total, aprovadas] = await Promise.all([
    prisma.indicacaoToken.count({ where: { indicadorId: advogadoId, indicadoId: { not: null } } }),
    prisma.indicacaoToken.count({ where: { indicadorId: advogadoId, status: 'APROVADA' } }),
  ]);

  return { codigo, total, aprovadas, tokensGanhos: aprovadas * TOKENS_INDICACAO };
}

export async function usarCodigo(indicadoId: string, codigo: string) {
  const indicacao = await prisma.indicacaoToken.findUnique({ where: { codigoIndicacao: codigo } });
  if (!indicacao) throw new HttpError(404, 'Código de indicação inválido');
  if (indicacao.indicadorId === indicadoId) throw new HttpError(400, 'Você não pode usar seu próprio código');
  if (indicacao.indicadoId) throw new HttpError(409, 'Este código de indicação já foi utilizado');

  await prisma.indicacaoToken.update({
    where: { codigoIndicacao: codigo },
    data: { indicadoId, status: 'APROVADA', tokensCreditos: TOKENS_INDICACAO },
  });

  // Credit the referrer
  await creditarTokens(
    indicacao.indicadorId,
    TOKENS_INDICACAO,
    'BONUS',
    `Indicação aprovada — código ${codigo}`,
    indicacao.id,
  );

  // Bonus boas-vindas for the new user
  await creditarTokens(
    indicadoId,
    50,
    'BONUS',
    `Bônus de boas-vindas por indicação`,
    indicacao.id,
  );

  return { ok: true, tokensIndicador: TOKENS_INDICACAO, tokensIndicado: 50 };
}

export async function listarIndicacoes(advogadoId: string) {
  return prisma.indicacaoToken.findMany({
    where: { indicadorId: advogadoId, indicadoId: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      tokensCreditos: true,
      codigoIndicacao: true,
      createdAt: true,
      indicado: { select: { nome: true, oabUf: true } },
    },
  });
}
