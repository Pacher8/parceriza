import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { creditarTokens } from './token.service.js';

export async function listarParceiros() {
  const parceiros = await prisma.tokenParceiro.findMany({
    where: { ativo: true },
    include: {
      regras: {
        where: { ativo: true },
        orderBy: { tokensRecompensa: 'desc' },
      },
    },
    orderBy: { nome: 'asc' },
  });
  return parceiros;
}

export async function resgatarRegra(
  advogadoId: string,
  regraId: string,
  comprovanteJson?: Record<string, unknown>,
) {
  const regra = await prisma.regraTokenParceiro.findUnique({
    where: { id: regraId },
    include: { parceiro: true },
  });
  if (!regra || !regra.ativo) throw new HttpError(404, 'Regra de recompensa não encontrada ou inativa');

  if (regra.validoAte && regra.validoAte < new Date()) {
    throw new HttpError(410, 'Esta promoção expirou');
  }

  if (regra.limiteUsosTotal && regra.totalUsado >= regra.limiteUsosTotal) {
    throw new HttpError(410, 'Limite total de resgates atingido');
  }

  if (regra.limiteUsosPorAdvogado) {
    const usosAdvogado = await prisma.historicoTokenParceiro.count({
      where: { advogadoId, regraId },
    });
    if (usosAdvogado >= regra.limiteUsosPorAdvogado) {
      throw new HttpError(409, 'Você já atingiu o limite de resgates para esta recompensa');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.historicoTokenParceiro.create({
      data: {
        advogadoId,
        regraId,
        parceiroId: regra.parceiroId,
        tokensCreditos: regra.tokensRecompensa,
        comprovanteJson: comprovanteJson ? JSON.stringify(comprovanteJson) : null,
      },
    });
    await tx.regraTokenParceiro.update({
      where: { id: regraId },
      data: { totalUsado: { increment: 1 } },
    });
  });

  await creditarTokens(
    advogadoId,
    regra.tokensRecompensa,
    'BONUS',
    `Parceiro ${regra.parceiro.nome}: ${regra.titulo}`,
    regraId,
  );

  return { tokensCredits: regra.tokensRecompensa, regra: { titulo: regra.titulo } };
}

export async function processarWebhookParceiro(
  chaveApi: string,
  body: {
    advogadoId?: string;
    oab?: string;
    oabUf?: string;
    regraId: string;
    comprovanteJson?: Record<string, unknown>;
  },
) {
  const parceiro = await prisma.tokenParceiro.findUnique({ where: { chaveApi } });
  if (!parceiro) throw new HttpError(401, 'Chave de API inválida');

  let advogadoId = body.advogadoId;
  if (!advogadoId && body.oab && body.oabUf) {
    const adv = await prisma.advogado.findUnique({
      where: { oab_oabUf: { oab: body.oab, oabUf: body.oabUf } },
      select: { id: true },
    });
    if (!adv) throw new HttpError(404, 'Advogado não encontrado');
    advogadoId = adv.id;
  }
  if (!advogadoId) throw new HttpError(400, 'advogadoId ou oab+oabUf necessário');

  return resgatarRegra(advogadoId, body.regraId, body.comprovanteJson);
}

export async function getHistoricoAdvogado(advogadoId: string) {
  return prisma.historicoTokenParceiro.findMany({
    where: { advogadoId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      parceiro: { select: { nome: true, logoUrl: true } },
      regra: { select: { titulo: true, tipo: true } },
    },
  });
}
