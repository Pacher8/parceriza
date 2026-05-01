import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { debitarTokens, verificarSaldo } from './token.service.js';
import type { CriarAnuncioInput, EditarAnuncioInput } from '../schemas/ads.schema.js';

const anuncioSelect = {
  id: true,
  titulo: true,
  descricao: true,
  mediaUrl: true,
  modelo: true,
  posicionamento: true,
  tokensLance: true,
  orcamentoTokens: true,
  gastoTokens: true,
  impressoes: true,
  cliques: true,
  status: true,
  inicioEm: true,
  fimEm: true,
  advogadoId: true,
  jobId: true,
  areaId: true,
  createdAt: true,
  updatedAt: true,
  job:  { select: { id: true, titulo: true } },
  area: { select: { id: true, nome: true, slug: true } },
} as const;

async function pausarSeEsgotado(anuncioId: string): Promise<void> {
  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    select: { gastoTokens: true, orcamentoTokens: true, status: true },
  });
  if (anuncio && anuncio.status === 'ATIVO' && anuncio.gastoTokens >= anuncio.orcamentoTokens) {
    await prisma.anuncio.update({ where: { id: anuncioId }, data: { status: 'PAUSADO' } });
  }
}

export async function criar(advogadoId: string, input: CriarAnuncioInput) {
  const temSaldo = await verificarSaldo(advogadoId, input.tokensLance);
  if (!temSaldo) throw new HttpError(402, 'Saldo insuficiente para o lance inicial');

  return prisma.anuncio.create({
    data: {
      advogadoId,
      titulo: input.titulo,
      descricao: input.descricao,
      mediaUrl: input.mediaUrl ?? null,
      modelo: input.modelo,
      posicionamento: input.posicionamento,
      tokensLance: input.tokensLance,
      orcamentoTokens: input.orcamentoTokens,
      jobId: input.jobId ?? null,
      areaId: input.areaId ?? null,
      inicioEm: input.inicioEm ? new Date(input.inicioEm) : null,
      fimEm: input.fimEm ? new Date(input.fimEm) : null,
      status: 'RASCUNHO',
      valorLance: 0,
      orcamentoTotal: 0,
    },
    select: anuncioSelect,
  });
}

export async function meusAnuncios(advogadoId: string) {
  const anuncios = await prisma.anuncio.findMany({
    where: { advogadoId },
    orderBy: { createdAt: 'desc' },
    select: anuncioSelect,
  });
  return anuncios.map((a) => ({
    ...a,
    ctr: a.impressoes > 0 ? ((a.cliques / a.impressoes) * 100).toFixed(2) : '0.00',
    orcamentoPct: a.orcamentoTokens > 0 ? Math.min(100, Math.round((a.gastoTokens / a.orcamentoTokens) * 100)) : 0,
  }));
}

export async function editar(advogadoId: string, anuncioId: string, input: EditarAnuncioInput) {
  const anuncio = await prisma.anuncio.findFirst({ where: { id: anuncioId, advogadoId } });
  if (!anuncio) throw new HttpError(404, 'Anúncio não encontrado');
  if (anuncio.status === 'ENCERRADO') throw new HttpError(409, 'Anúncio encerrado não pode ser editado');

  return prisma.anuncio.update({
    where: { id: anuncioId },
    data: {
      ...(input.titulo && { titulo: input.titulo }),
      ...(input.descricao && { descricao: input.descricao }),
      ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
      ...(input.tokensLance && { tokensLance: input.tokensLance }),
      ...(input.orcamentoTokens && { orcamentoTokens: input.orcamentoTokens }),
      ...(input.inicioEm !== undefined && { inicioEm: input.inicioEm ? new Date(input.inicioEm) : null }),
      ...(input.fimEm !== undefined && { fimEm: input.fimEm ? new Date(input.fimEm) : null }),
    },
    select: anuncioSelect,
  });
}

export async function atualizarStatus(advogadoId: string, anuncioId: string, status: 'ATIVO' | 'PAUSADO' | 'ENCERRADO') {
  const anuncio = await prisma.anuncio.findFirst({ where: { id: anuncioId, advogadoId } });
  if (!anuncio) throw new HttpError(404, 'Anúncio não encontrado');
  return prisma.anuncio.update({ where: { id: anuncioId }, data: { status }, select: anuncioSelect });
}

export async function getFeed(params: {
  posicionamento?: string;
  jobId?: string;
  areaId?: string;
  limite?: number;
}) {
  const now = new Date();
  const anuncios = await prisma.anuncio.findMany({
    where: {
      status: 'ATIVO',
      ...(params.posicionamento && { posicionamento: params.posicionamento }),
      ...(params.jobId && { jobId: params.jobId }),
      ...(params.areaId && { areaId: params.areaId }),
      OR: [{ fimEm: null }, { fimEm: { gte: now } }],
      AND: [
        { OR: [{ inicioEm: null }, { inicioEm: { lte: now } }] },
      ],
    },
    orderBy: { tokensLance: 'desc' },
    take: params.limite ?? 3,
    select: {
      id: true,
      titulo: true,
      descricao: true,
      mediaUrl: true,
      posicionamento: true,
      tokensLance: true,
      modelo: true,
      jobId: true,
      areaId: true,
    },
  });

  // Increment impressoes asynchronously (fire and forget)
  if (anuncios.length > 0) {
    const ids = anuncios.map((a) => a.id);
    prisma.anuncio.updateMany({ where: { id: { in: ids } }, data: { impressoes: { increment: 1 } } })
      .catch(() => {});
  }

  return anuncios;
}

export async function registrarClique(advogadoId: string, anuncioId: string) {
  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    select: { status: true, modelo: true, tokensLance: true, advogadoId: true, gastoTokens: true, orcamentoTokens: true },
  });
  if (!anuncio || anuncio.status !== 'ATIVO') return { ok: true };

  await prisma.anuncio.update({ where: { id: anuncioId }, data: { cliques: { increment: 1 } } });

  if (anuncio.modelo === 'CPC') {
    const temSaldo = await verificarSaldo(anuncio.advogadoId, anuncio.tokensLance);
    if (temSaldo) {
      await debitarTokens(
        anuncio.advogadoId,
        anuncio.tokensLance,
        'ANUNCIO',
        `Clique CPC — anúncio ${anuncioId}`,
        anuncioId,
      );
      await prisma.anuncio.update({
        where: { id: anuncioId },
        data: { gastoTokens: { increment: anuncio.tokensLance } },
      });
    }
    await pausarSeEsgotado(anuncioId);
  }

  return { ok: true };
}

// Public stats endpoint
export async function getStats() {
  const [totalAdvogados, totalJobs, totalLeads, totalParcerias, totalAnuncios] = await Promise.all([
    prisma.advogado.count({ where: { ativo: true } }),
    prisma.jobCatalogo.count({ where: { ativo: true, aprovado: true } }),
    prisma.lead.count(),
    prisma.parceria.count({ where: { status: 'ATIVA' } }),
    prisma.anuncio.count({ where: { status: 'ATIVO' } }),
  ]);
  return { totalAdvogados, totalJobs, totalLeads, totalParcerias, totalAnuncios };
}
