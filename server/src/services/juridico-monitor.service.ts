import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import * as datajud from './juridico-datajud.service.js';
import type { CriarMonitorInput } from '../schemas/juridico.schema.js';

export async function criarMonitor(advogadoId: string, input: CriarMonitorInput) {
  const existing = await prisma.processoMonitor.findUnique({
    where: { advogadoId_documento: { advogadoId, documento: input.documento } },
  });
  if (existing) throw new HttpError(409, 'Monitor já existe para este documento');

  return prisma.processoMonitor.create({
    data: {
      advogadoId,
      documento: input.documento.replace(/\D/g, ''),
      tipoDocumento: input.tipoDocumento,
      nomeMonitorado: input.nomeMonitorado ?? null,
      ativo: true,
    },
    select: {
      id: true,
      documento: true,
      tipoDocumento: true,
      nomeMonitorado: true,
      ativo: true,
      ultimaVerificacaoEm: true,
      createdAt: true,
      _count: { select: { processos: true } },
    },
  });
}

export async function listarMonitores(advogadoId: string) {
  return prisma.processoMonitor.findMany({
    where: { advogadoId, ativo: true, NOT: { documento: { startsWith: 'NUM:' } } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      documento: true,
      tipoDocumento: true,
      nomeMonitorado: true,
      ativo: true,
      ultimaVerificacaoEm: true,
      createdAt: true,
      _count: { select: { processos: true } },
      processos: {
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          numeroProcesso: true,
          tribunal: true,
          classe: true,
          status: true,
          ultimaAtualizacaoEm: true,
        },
      },
    },
  });
}

export async function removerMonitor(advogadoId: string, monitorId: string) {
  const monitor = await prisma.processoMonitor.findFirst({ where: { id: monitorId, advogadoId } });
  if (!monitor) throw new HttpError(404, 'Monitor não encontrado');
  await prisma.processoMonitor.update({ where: { id: monitorId }, data: { ativo: false } });
}

// Called by cron job — runs check for all active monitors
export async function verificarTodosMonitores(): Promise<void> {
  const monitores = await prisma.processoMonitor.findMany({
    where: { ativo: true, NOT: { documento: { startsWith: 'NUM:' } } },
    select: { id: true, advogadoId: true, documento: true, tipoDocumento: true },
  });

  console.log(`[monitor-job] verificando ${monitores.length} monitores ativos`);

  for (const monitor of monitores) {
    try {
      const processos = await datajud.buscarMultiTribunal({ documento: monitor.documento });

      for (const p of processos) {
        await prisma.processo.upsert({
          where: { monitorId_numeroProcesso: { monitorId: monitor.id, numeroProcesso: p.numeroProcesso } },
          update: {
            partes: JSON.stringify(p.partes ?? []),
            movimentacoes: JSON.stringify(p.movimentos ?? []),
            ultimaAtualizacaoEm: new Date(),
          },
          create: {
            ...datajud.mapToProcesso(p),
            monitorId: monitor.id,
          },
        });
      }

      await prisma.processoMonitor.update({
        where: { id: monitor.id },
        data: { ultimaVerificacaoEm: new Date() },
      });

      console.log(`  [monitor-job] ${monitor.documento}: ${processos.length} processos encontrados`);
    } catch (err) {
      console.error(`  [monitor-job] erro no monitor ${monitor.id}:`, err instanceof Error ? err.message : err);
    }
  }
}
