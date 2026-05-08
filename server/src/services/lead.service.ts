import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { CriarLeadInput, FecharLeadInput } from '../schemas/marketplace.schema.js';

const leadSelect = {
  id: true,
  descricao: true,
  estadoCliente: true,
  valorEstimado: true,
  status: true,
  comissaoAcordada: true,
  createdAt: true,
  updatedAt: true,
  job: { select: { id: true, titulo: true, tipo: true, area: { select: { nome: true, slug: true } } } },
  advogadoCaptor: { select: { id: true, nome: true, oabUf: true } },
  advogadoMatch: { select: { id: true, nome: true, oabUf: true } },
} as const;

export async function criarLead(data: CriarLeadInput, advogadoCaptorId: string) {
  const job = await prisma.jobCatalogo.findUnique({
    where: { id: data.jobId },
    select: { id: true, ativo: true, aprovado: true },
  });
  if (!job) throw new HttpError(404, 'JOB não encontrado');
  if (!job.ativo || !job.aprovado) throw new HttpError(422, 'JOB indisponível');

  return prisma.lead.create({
    data: {
      jobId: data.jobId,
      advogadoCaptorId,
      descricao: data.descricao,
      estadoCliente: data.estadoCliente,
      valorEstimado: data.valorEstimado,
    },
    select: leadSelect,
  });
}

export async function meusLeads(advogadoCaptorId: string) {
  return prisma.lead.findMany({
    where: { advogadoCaptorId },
    orderBy: { createdAt: 'desc' },
    select: leadSelect,
  });
}

export async function leadsDisponiveis(advogadoId: string) {
  const ofertas = await prisma.jobOferta.findMany({
    where: { advogadoId, ativo: true },
    select: { jobId: true },
  });

  if (ofertas.length === 0) return [];

  const jobIds = ofertas.map((o) => o.jobId);

  return prisma.lead.findMany({
    where: {
      jobId: { in: jobIds },
      status: 'ABERTO',
      advogadoCaptorId: { not: advogadoId },
      advogadoMatchId: null,
    },
    orderBy: { createdAt: 'desc' },
    select: leadSelect,
  });
}

export async function aceitarMatch(leadId: string, advogadoId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true, jobId: true, advogadoCaptorId: true, advogadoMatchId: true },
  });

  if (!lead) throw new HttpError(404, 'Lead não encontrado');
  if (lead.status !== 'ABERTO') throw new HttpError(409, 'Lead não está mais disponível para match');
  if (lead.advogadoCaptorId === advogadoId) throw new HttpError(403, 'Você não pode aceitar match no seu próprio lead');

  const oferta = await prisma.jobOferta.findUnique({
    where: { advogadoId_jobId: { advogadoId, jobId: lead.jobId } },
    select: { id: true, ativo: true },
  });
  if (!oferta?.ativo) throw new HttpError(403, 'Você não está habilitado neste JOB');

  const [updatedLead] = await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { advogadoMatchId: advogadoId, status: 'EM_NEGOCIACAO' },
      select: leadSelect,
    }),
    prisma.jobOferta.update({
      where: { id: oferta.id },
      data: { totalLeads: { increment: 1 } },
    }),
  ]);

  return updatedLead;
}

export async function fecharLead(leadId: string, advogadoId: string, data: FecharLeadInput) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true, advogadoCaptorId: true, advogadoMatchId: true, jobId: true },
  });

  if (!lead) throw new HttpError(404, 'Lead não encontrado');
  if (!['ABERTO', 'EM_NEGOCIACAO'].includes(lead.status)) {
    throw new HttpError(409, 'Lead não pode ser fechado neste estado');
  }

  const isCaptor = lead.advogadoCaptorId === advogadoId;
  const isMatch = lead.advogadoMatchId === advogadoId;
  if (!isCaptor && !isMatch) throw new HttpError(403, 'Sem permissão para fechar este lead');

  // Incrementa totalFechados na oferta do advogado que fez match
  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.lead.update({
      where: { id: leadId },
      data: { status: 'FECHADO', comissaoAcordada: data.comissaoAcordada },
      select: leadSelect,
    }),
  ];

  if (lead.advogadoMatchId) {
    const oferta = await prisma.jobOferta.findUnique({
      where: { advogadoId_jobId: { advogadoId: lead.advogadoMatchId, jobId: lead.jobId } },
      select: { id: true },
    });
    if (oferta) {
      updates.push(
        prisma.jobOferta.update({
          where: { id: oferta.id },
          data: { totalFechados: { increment: 1 } },
        }),
      );
    }
  }

  const [updatedLead] = await prisma.$transaction(updates);
  return updatedLead;
}
