import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { creditarTokens } from './token.service.js';

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

export async function listarTarefas(advogadoId: string) {
  const [tarefas, completadas] = await Promise.all([
    prisma.tarefaToken.findMany({
      where: { ativo: true },
      orderBy: [{ tipo: 'asc' }, { recompensaTokens: 'desc' }],
    }),
    prisma.advogadoTarefa.findMany({
      where: { advogadoId },
      select: { tarefaId: true, completadaEm: true, tokensGanhos: true },
    }),
  ]);

  const completadasMap = new Map(completadas.map((c) => [c.tarefaId, c]));

  return tarefas.map((t) => {
    const completada = completadasMap.get(t.id);
    let disponivel = true;
    let completadaEm: Date | null = null;

    if (completada) {
      completadaEm = completada.completadaEm;
      if (t.repeticao === 'UNICA') {
        disponivel = false;
      } else if (t.repeticao === 'SEMANAL') {
        disponivel = completada.completadaEm < startOfWeek();
      } else if (t.repeticao === 'MENSAL') {
        disponivel = completada.completadaEm < startOfMonth();
      }
    }

    return { ...t, disponivel, completadaEm, tokensGanhos: completada?.tokensGanhos ?? null };
  });
}

export async function completarTarefa(advogadoId: string, tarefaId: string) {
  const tarefa = await prisma.tarefaToken.findUnique({ where: { id: tarefaId } });
  if (!tarefa || !tarefa.ativo) throw new HttpError(404, 'Tarefa não encontrada');

  const existing = await prisma.advogadoTarefa.findUnique({
    where: { advogadoId_tarefaId: { advogadoId, tarefaId } },
  });

  if (existing) {
    if (tarefa.repeticao === 'UNICA') throw new HttpError(409, 'Tarefa já completada');
    if (tarefa.repeticao === 'SEMANAL' && existing.completadaEm >= startOfWeek()) {
      throw new HttpError(409, 'Tarefa já completada esta semana');
    }
    if (tarefa.repeticao === 'MENSAL' && existing.completadaEm >= startOfMonth()) {
      throw new HttpError(409, 'Tarefa já completada este mês');
    }

    await prisma.advogadoTarefa.update({
      where: { advogadoId_tarefaId: { advogadoId, tarefaId } },
      data: { completadaEm: new Date(), tokensGanhos: tarefa.recompensaTokens },
    });
  } else {
    await prisma.advogadoTarefa.create({
      data: { advogadoId, tarefaId, completadaEm: new Date(), tokensGanhos: tarefa.recompensaTokens },
    });
  }

  await creditarTokens(
    advogadoId,
    tarefa.recompensaTokens,
    'BONUS',
    `Tarefa completada: ${tarefa.titulo}`,
    tarefaId,
  );

  return { tarefa, tokensGanhos: tarefa.recompensaTokens };
}

export async function getRanking() {
  const inicioMes = startOfMonth();
  const ranking = await prisma.transacao.groupBy({
    by: ['advogadoId'],
    where: { tipo: 'CREDITO', createdAt: { gte: inicioMes } },
    _sum: { quantidade: true },
    orderBy: { _sum: { quantidade: 'desc' } },
    take: 10,
  });

  const advogadosIds = ranking.map((r) => r.advogadoId);
  const advogados = await prisma.advogado.findMany({
    where: { id: { in: advogadosIds } },
    select: { id: true, nome: true, avatarUrl: true, oabUf: true },
  });
  const advMap = new Map(advogados.map((a) => [a.id, a]));

  return ranking.map((r, i) => ({
    posicao: i + 1,
    advogado: advMap.get(r.advogadoId),
    tokensGanhos: r._sum.quantidade ?? 0,
  })).filter((r) => r.advogado);
}

export async function getConquistas(advogadoId: string) {
  return prisma.advogadoTarefa.findMany({
    where: { advogadoId },
    include: { tarefa: true },
    orderBy: { completadaEm: 'desc' },
  });
}
