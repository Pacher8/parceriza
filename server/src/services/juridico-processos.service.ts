import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import * as datajud from './juridico-datajud.service.js';
import type { ConsultarProcessoInput } from '../schemas/juridico.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const TRF_TRIBUNAIS = new Set(['trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6']);

export async function consultarProcesso(advogadoId: string, input: ConsultarProcessoInput) {
  const tribunal = input.tribunal ?? 'tjsc';
  let processos: datajud.DataJudProcesso[] = [];
  let porTribunal: Record<string, number> | undefined;

  const filtros: datajud.FiltrosConsulta = {
    numero:     input.numero,
    classe:     input.classe,
    assunto:    input.assunto,
    vara:       input.vara,
    grau:       input.grau,
    dataInicio: input.dataInicio,
    dataFim:    input.dataFim,
  };

  console.log(`[JURIDICO] consulta: tribunal=${tribunal} multiTribunal=${input.multiTribunal} filtros=${JSON.stringify(filtros)}`);

  if (input.multiTribunal) {
    const tribunais = input.tribunais?.length ? input.tribunais : undefined;
    const result = await datajud.buscarMultiTribunal(filtros, tribunais);
    processos = result.processos;
    porTribunal = result.porTribunal;
  } else if (input.numero) {
    processos = await datajud.buscarPorNumero(input.numero, tribunal);
    if (processos.length === 0) throw new HttpError(404, 'Nenhum processo encontrado para o número informado');
  } else {
    processos = await datajud.buscarComFiltros(filtros, tribunal);
    if (processos.length === 0) {
      throw new HttpError(404, 'Nenhum processo encontrado para os critérios informados');
    }
  }

  console.log(`[JURIDICO] retornados: ${processos.length} processos`);

  // Upsert each result into our DB
  const saved = await Promise.all(
    processos.map(async (p) => {
      // Find or create a monitor to link to (orphan record if no monitor)
      let monitor = await prisma.processoMonitor.findFirst({
        where: { advogadoId, documento: `NUM:${p.numeroProcesso}` },
      });

      if (!monitor) {
        // Número search without a monitor — store temporarily on a sentinel monitor
        monitor = await prisma.processoMonitor.upsert({
          where: { advogadoId_documento: { advogadoId, documento: `NUM:${p.numeroProcesso}` } },
          update: {},
          create: {
            advogadoId,
            documento: `NUM:${p.numeroProcesso}`,
            tipoDocumento: 'CPF',
            nomeMonitorado: p.numeroProcesso,
          },
        });
      }

      const mapped = datajud.mapToProcesso(p);
      return prisma.processo.upsert({
        where: { monitorId_numeroProcesso: { monitorId: monitor.id, numeroProcesso: mapped.numeroProcesso } },
        update: {
          partes: mapped.partes,
          movimentacoes: mapped.movimentacoes,
          ultimaAtualizacaoEm: new Date(),
        },
        create: { ...mapped, monitorId: monitor.id },
      });
    }),
  );

  return { total: processos.length, processos: saved, porTribunal: porTribunal ?? {} };
}

export async function listarProcessos(advogadoId: string) {
  const monitores = await prisma.processoMonitor.findMany({
    where: { advogadoId },
    include: {
      processos: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          numeroProcesso: true,
          tribunal: true,
          vara: true,
          classe: true,
          status: true,
          ultimaAtualizacaoEm: true,
        },
      },
    },
  });

  return monitores.flatMap((m) => m.processos);
}

export async function getProcesso(advogadoId: string, processoId: string) {
  const monitores = await prisma.processoMonitor.findMany({
    where: { advogadoId },
    select: { id: true },
  });
  const monitorIds = monitores.map((m) => m.id);

  const processo = await prisma.processo.findFirst({
    where: { id: processoId, monitorId: { in: monitorIds } },
  });
  if (!processo) throw new HttpError(404, 'Processo não encontrado');
  return processo;
}

export async function gerarResumo(advogadoId: string, processoId: string): Promise<string> {
  const processo = await getProcesso(advogadoId, processoId);

  if (processo.resumoIA) return processo.resumoIA;

  const partes = processo.partes ? JSON.parse(processo.partes) : [];
  const movimentacoes = processo.movimentacoes ? JSON.parse(processo.movimentacoes) : [];

  const contexto = [
    `Número: ${processo.numeroProcesso}`,
    `Tribunal: ${processo.tribunal ?? 'N/A'}`,
    `Vara: ${processo.vara ?? 'N/A'}`,
    `Classe: ${processo.classe ?? 'N/A'}`,
    `Assunto: ${processo.assunto ?? 'N/A'}`,
    `Partes: ${partes.map((p: { polo: string; nome: string }) => `${p.polo}: ${p.nome}`).join('; ')}`,
    `Últimas movimentações: ${movimentacoes.slice(0, 5).map((m: { nome: string; dataHora: string }) => `${m.dataHora?.slice(0, 10)} - ${m.nome}`).join('; ')}`,
  ].join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: 'Você é um assistente jurídico. Gere um resumo objetivo e claro do processo, destacando partes, objeto da ação e situação atual. Máximo de 200 palavras. Responda em português.',
    messages: [{ role: 'user', content: `Resuma este processo:\n\n${contexto}` }],
  });

  const resumo = response.content[0]?.type === 'text' ? response.content[0].text : '';
  await prisma.processo.update({ where: { id: processoId }, data: { resumoIA: resumo } });
  return resumo;
}
