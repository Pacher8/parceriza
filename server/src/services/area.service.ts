import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { ListJobsQuery } from '../schemas/marketplace.schema.js';

export async function listAreas() {
  return prisma.areaJuridica.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
    select: { id: true, nome: true, slug: true, descricao: true, icone: true, ordem: true },
  });
}

export async function getAreaBySlug(slug: string) {
  const area = await prisma.areaJuridica.findUnique({
    where: { slug },
    select: { id: true, nome: true, slug: true, descricao: true },
  });
  if (!area) throw new HttpError(404, 'Área não encontrada');
  return area;
}

export async function listJobsByArea(slug: string, query: ListJobsQuery) {
  const area = await getAreaBySlug(slug);

  return prisma.jobCatalogo.findMany({
    where: {
      areaId: area.id,
      ativo: true,
      aprovado: true,
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
    orderBy: { titulo: 'asc' },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      tipo: true,
      area: { select: { nome: true, slug: true } },
      _count: { select: { ofertas: { where: { ativo: true } } } },
    },
  });
}
