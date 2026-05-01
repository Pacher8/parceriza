// Base token service — reused everywhere in the system
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';

export type TokenOrigem =
  | 'COMPRA' | 'BONUS' | 'PAGAMENTO_SERVICO' | 'COMISSAO_PARCERIA'
  | 'ANUNCIO' | 'REEMBOLSO' | 'AJUSTE';

export async function creditarTokens(
  advogadoId: string,
  quantidade: number,
  origem: TokenOrigem,
  descricao: string,
  referenciaId?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.advogado.update({
      where: { id: advogadoId },
      data: { saldoTokens: { increment: quantidade } },
    });
    await tx.transacao.create({
      data: {
        advogadoId,
        tipo: 'CREDITO',
        origem,
        quantidade,
        descricao,
        referenciaId: referenciaId ?? null,
      },
    });
  });
}

export async function debitarTokens(
  advogadoId: string,
  quantidade: number,
  origem: TokenOrigem,
  descricao: string,
  referenciaId?: string,
): Promise<void> {
  const advogado = await prisma.advogado.findUnique({
    where: { id: advogadoId },
    select: { saldoTokens: true },
  });
  if (!advogado) throw new HttpError(404, 'Advogado não encontrado');
  if (advogado.saldoTokens < quantidade) {
    throw new HttpError(402, `Saldo insuficiente. Você tem ${advogado.saldoTokens} tokens, precisa de ${quantidade}.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.advogado.update({
      where: { id: advogadoId },
      data: { saldoTokens: { decrement: quantidade } },
    });
    await tx.transacao.create({
      data: {
        advogadoId,
        tipo: 'DEBITO',
        origem,
        quantidade,
        descricao,
        referenciaId: referenciaId ?? null,
      },
    });
  });
}

export async function verificarSaldo(advogadoId: string, quantidade: number): Promise<boolean> {
  const adv = await prisma.advogado.findUnique({
    where: { id: advogadoId },
    select: { saldoTokens: true },
  });
  return (adv?.saldoTokens ?? 0) >= quantidade;
}

export async function getSaldo(advogadoId: string) {
  const adv = await prisma.advogado.findUnique({
    where: { id: advogadoId },
    select: { saldoTokens: true, nome: true },
  });
  if (!adv) throw new HttpError(404, 'Advogado não encontrado');

  const [ganhosMes, gastosMes] = await Promise.all([
    prisma.transacao.aggregate({
      where: {
        advogadoId,
        tipo: 'CREDITO',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { quantidade: true },
    }),
    prisma.transacao.aggregate({
      where: {
        advogadoId,
        tipo: 'DEBITO',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { quantidade: true },
    }),
  ]);

  return {
    saldo: adv.saldoTokens,
    nome: adv.nome,
    ganhosMes: ganhosMes._sum.quantidade ?? 0,
    gastosMes: gastosMes._sum.quantidade ?? 0,
    valorReais: (adv.saldoTokens * 0.10).toFixed(2),
  };
}
