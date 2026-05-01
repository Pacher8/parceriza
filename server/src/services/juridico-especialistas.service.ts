import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type {
  CriarEspecialistaInput,
  ConsultarEspecialistaInput,
  AvaliarEspecialistaInput,
} from '../schemas/juridico.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const especialistaSelect = {
  id: true,
  nome: true,
  descricao: true,
  area: true,
  precoTokens: true,
  publico: true,
  aprovado: true,
  totalUsos: true,
  criadorId: true,
  createdAt: true,
  avaliacoes: {
    select: { nota: true },
  },
} as const;

function calcMedia(avaliacoes: { nota: number }[]) {
  if (!avaliacoes.length) return null;
  return avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length;
}

export async function listarEspecialistas(area?: string) {
  const especialistas = await prisma.agenteEspecialista.findMany({
    where: { publico: true, aprovado: true, ...(area && { area }) },
    orderBy: { totalUsos: 'desc' },
    select: especialistaSelect,
  });
  return especialistas.map((e) => ({ ...e, mediaAvaliacao: calcMedia(e.avaliacoes) }));
}

export async function getEspecialista(id: string) {
  const e = await prisma.agenteEspecialista.findFirst({
    where: { id, publico: true, aprovado: true },
    select: { ...especialistaSelect, promptSistema: true, exemplos: true },
  });
  if (!e) throw new HttpError(404, 'Agente especialista não encontrado');
  return { ...e, mediaAvaliacao: calcMedia(e.avaliacoes) };
}

export async function criarEspecialista(advogadoId: string, input: CriarEspecialistaInput) {
  return prisma.agenteEspecialista.create({
    data: {
      criadorId: advogadoId,
      nome: input.nome,
      descricao: input.descricao,
      area: input.area,
      promptSistema: input.promptSistema,
      exemplos: input.exemplos ? JSON.stringify(input.exemplos) : null,
      precoTokens: input.precoTokens,
      publico: input.publico,
      aprovado: false,
    },
    select: { id: true, nome: true, area: true, aprovado: true, publico: true, createdAt: true },
  });
}

export async function consultarEspecialista(
  advogadoId: string,
  especialistaId: string,
  input: ConsultarEspecialistaInput,
) {
  const especialista = await prisma.agenteEspecialista.findFirst({
    where: { id: especialistaId },
    select: { id: true, nome: true, promptSistema: true, precoTokens: true, aprovado: true },
  });
  if (!especialista) throw new HttpError(404, 'Agente especialista não encontrado');
  if (!especialista.aprovado) throw new HttpError(403, 'Este agente ainda não foi aprovado para uso');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    temperature: 0.3,
    system: especialista.promptSistema,
    messages: [{ role: 'user', content: input.descricaoCaso }],
  });

  const analise = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const tokensUsados = response.usage.input_tokens + response.usage.output_tokens;

  // Increment usage counter
  await prisma.agenteEspecialista.update({
    where: { id: especialistaId },
    data: { totalUsos: { increment: 1 } },
  });

  return { analise, tokensUsados, especialista: { id: especialista.id, nome: especialista.nome } };
}

export async function avaliarEspecialista(
  advogadoId: string,
  especialistaId: string,
  input: AvaliarEspecialistaInput,
) {
  const especialista = await prisma.agenteEspecialista.findUnique({ where: { id: especialistaId } });
  if (!especialista) throw new HttpError(404, 'Agente especialista não encontrado');

  return prisma.avaliacaoAgente.upsert({
    where: { agenteId_autorId: { agenteId: especialistaId, autorId: advogadoId } },
    update: { nota: input.nota, comentario: input.comentario ?? null },
    create: {
      agenteId: especialistaId,
      autorId: advogadoId,
      nota: input.nota,
      comentario: input.comentario ?? null,
    },
    select: { id: true, nota: true, comentario: true, createdAt: true },
  });
}

export async function meusEspecialistas(advogadoId: string) {
  const lista = await prisma.agenteEspecialista.findMany({
    where: { criadorId: advogadoId },
    orderBy: { createdAt: 'desc' },
    select: { ...especialistaSelect, aprovado: true },
  });
  return lista.map((e) => ({ ...e, mediaAvaliacao: calcMedia(e.avaliacoes) }));
}
