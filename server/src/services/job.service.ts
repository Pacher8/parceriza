import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { ListJobsQuery, SugerirJobInput } from '../schemas/marketplace.schema.js';

const jobListSelect = {
  id: true,
  titulo: true,
  descricao: true,
  tipo: true,
  aprovado: true,
  area: { select: { nome: true, slug: true } },
  _count: { select: { ofertas: { where: { ativo: true } } } },
} as const;

export async function listJobs(query: ListJobsQuery) {
  return prisma.jobCatalogo.findMany({
    where: {
      ativo: true,
      aprovado: true,
      ...(query.area ? { area: { slug: query.area } } : {}),
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.busca
        ? {
            OR: [
              { titulo: { contains: query.busca } },
              { descricao: { contains: query.busca } },
            ],
          }
        : {}),
    },
    orderBy: [{ area: { ordem: 'asc' } }, { titulo: 'asc' }],
    select: jobListSelect,
  });
}

export async function getJob(id: string) {
  const job = await prisma.jobCatalogo.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      tipo: true,
      aprovado: true,
      area: { select: { nome: true, slug: true } },
      ofertas: {
        where: { ativo: true },
        orderBy: [{ destaque: 'desc' }, { totalFechados: 'desc' }],
        select: {
          id: true,
          descricaoCustom: true,
          valorEstimadoMin: true,
          valorEstimadoMax: true,
          comissaoPct: true,
          destaque: true,
          totalLeads: true,
          totalFechados: true,
          advogado: {
            select: { id: true, nome: true, oab: true, oabUf: true, bio: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!job) throw new HttpError(404, 'JOB não encontrado');
  return job;
}

export async function sugerirJob(data: SugerirJobInput, advogadoId: string) {
  const area = await prisma.areaJuridica.findUnique({
    where: { id: data.areaId },
    select: { id: true },
  });
  if (!area) throw new HttpError(404, 'Área não encontrada');

  return prisma.jobCatalogo.create({
    data: {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      areaId: data.areaId,
      sugeridoPorId: advogadoId,
      aprovado: false,
    },
    select: { id: true, titulo: true, tipo: true, aprovado: true },
  });
}
