import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { CriarOfertaInput, EditarOfertaInput } from '../schemas/marketplace.schema.js';

export async function criarOferta(jobId: string, advogadoId: string, data: CriarOfertaInput) {
  const job = await prisma.jobCatalogo.findUnique({
    where: { id: jobId },
    select: { id: true, ativo: true, aprovado: true },
  });
  if (!job) throw new HttpError(404, 'JOB não encontrado');
  if (!job.ativo || !job.aprovado) throw new HttpError(422, 'JOB indisponível para habilitação');

  const existente = await prisma.jobOferta.findUnique({
    where: { advogadoId_jobId: { advogadoId, jobId } },
    select: { id: true, ativo: true },
  });

  if (existente) {
    if (existente.ativo) throw new HttpError(409, 'Você já está habilitado neste JOB');
    // reativar oferta inativa
    return prisma.jobOferta.update({
      where: { id: existente.id },
      data: { ativo: true, ...data },
      select: ofertaSelect,
    });
  }

  return prisma.jobOferta.create({
    data: { jobId, advogadoId, ...data },
    select: ofertaSelect,
  });
}

export async function editarOferta(ofertaId: string, advogadoId: string, data: EditarOfertaInput) {
  const oferta = await prisma.jobOferta.findUnique({
    where: { id: ofertaId },
    select: { id: true, advogadoId: true },
  });
  if (!oferta) throw new HttpError(404, 'Oferta não encontrada');
  if (oferta.advogadoId !== advogadoId) throw new HttpError(403, 'Sem permissão');

  return prisma.jobOferta.update({
    where: { id: ofertaId },
    data,
    select: ofertaSelect,
  });
}

export async function removerOferta(ofertaId: string, advogadoId: string) {
  const oferta = await prisma.jobOferta.findUnique({
    where: { id: ofertaId },
    select: { id: true, advogadoId: true },
  });
  if (!oferta) throw new HttpError(404, 'Oferta não encontrada');
  if (oferta.advogadoId !== advogadoId) throw new HttpError(403, 'Sem permissão');

  await prisma.jobOferta.update({
    where: { id: ofertaId },
    data: { ativo: false },
  });
}

export async function minhasOfertas(advogadoId: string) {
  return prisma.jobOferta.findMany({
    where: { advogadoId },
    orderBy: { createdAt: 'desc' },
    select: {
      ...ofertaSelect,
      job: {
        select: {
          titulo: true,
          tipo: true,
          area: { select: { nome: true, slug: true } },
        },
      },
    },
  });
}

const ofertaSelect = {
  id: true,
  descricaoCustom: true,
  valorEstimadoMin: true,
  valorEstimadoMax: true,
  comissaoPct: true,
  destaque: true,
  totalLeads: true,
  totalFechados: true,
  ativo: true,
  createdAt: true,
} as const;
