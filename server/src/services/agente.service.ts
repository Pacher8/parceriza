import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { AtualizarConfigInput, ConversarInput } from '../schemas/agente.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const MODEL_MAP: Record<string, string> = {
  CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',
  CLAUDE_SONNET: 'claude-sonnet-4-6',
  CLAUDE_OPUS: 'claude-opus-4-7',
};

function buildSystemPrompt(
  config: { nome: string; personalidade: string | null; tomDeVoz: string | null; promptSistema: string | null },
  advogado: { nome: string; bio: string | null },
): string {
  const lines: string[] = [
    `Você é ${config.nome}, assistente jurídico pessoal do advogado(a) ${advogado.nome}.`,
    'Seu papel é atender clientes e parceiros com informações jurídicas gerais, sempre de forma ética e responsável.',
  ];

  if (config.personalidade) {
    lines.push(`\nPersonalidade: ${config.personalidade}`);
  }

  if (config.tomDeVoz) {
    lines.push(`Tom de voz: ${config.tomDeVoz}`);
  }

  if (advogado.bio) {
    lines.push(`\nÁrea de atuação do advogado: ${advogado.bio}`);
  }

  lines.push(
    '\nDiretrizes obrigatórias da Parceriza:',
    '- Seja sempre profissional, ético e respeitoso.',
    '- Nunca emita pareceres jurídicos definitivos nem substitua a consulta com um advogado.',
    '- Ao identificar necessidade de orientação específica, indique que o advogado pode ajudar.',
    '- Não invente legislação, jurisprudência ou informações que não tem certeza.',
    '- Responda em português brasileiro.',
  );

  if (config.promptSistema) {
    lines.push(`\nInstruções personalizadas do advogado:\n${config.promptSistema}`);
  }

  return lines.join('\n');
}

async function getOrCreateConfig(advogadoId: string) {
  let config = await prisma.agenteConfig.findUnique({ where: { advogadoId } });
  if (!config) {
    config = await prisma.agenteConfig.create({
      data: { advogadoId, nome: 'Assistente', modelo: 'CLAUDE_HAIKU' },
    });
  }
  return config;
}

export async function getConfig(advogadoId: string) {
  return getOrCreateConfig(advogadoId);
}

export async function atualizarConfig(advogadoId: string, data: AtualizarConfigInput) {
  await getOrCreateConfig(advogadoId);
  return prisma.agenteConfig.update({
    where: { advogadoId },
    data,
  });
}

export async function conversar(advogadoId: string, input: ConversarInput) {
  const [config, advogado] = await Promise.all([
    getOrCreateConfig(advogadoId),
    prisma.advogado.findUnique({
      where: { id: advogadoId },
      select: { nome: true, bio: true },
    }),
  ]);

  if (!advogado) throw new HttpError(404, 'Advogado não encontrado');

  let conversa;
  if (input.conversaId) {
    conversa = await prisma.conversaAgente.findFirst({
      where: { id: input.conversaId, advogadoId },
    });
    if (!conversa) throw new HttpError(404, 'Conversa não encontrada');
  } else {
    conversa = await prisma.conversaAgente.create({
      data: {
        advogadoId,
        canal: 'TESTE',
        clienteNome: input.clienteNome ?? null,
      },
    });
  }

  const historico = await prisma.mensagemAgente.findMany({
    where: { conversaId: conversa.id },
    orderBy: { createdAt: 'asc' },
    select: { papel: true, conteudo: true },
  });

  const messages: Anthropic.MessageParam[] = [
    ...historico.map((m) => ({
      role: m.papel.toLowerCase() as 'user' | 'assistant',
      content: m.conteudo,
    })),
    { role: 'user', content: input.mensagem },
  ];

  const modelId = MODEL_MAP[config.modelo] ?? 'claude-haiku-4-5-20251001';
  const systemPrompt = buildSystemPrompt(config, advogado);

  const response = await anthropic.messages.create({
    model: modelId as Anthropic.Model,
    max_tokens: 1024,
    temperature: config.temperatura,
    system: systemPrompt,
    messages,
  });

  const respostaTexto =
    response.content[0]?.type === 'text' ? response.content[0].text : '';

  const tokensUsados = response.usage.input_tokens + response.usage.output_tokens;

  await prisma.$transaction(async (tx) => {
    await tx.mensagemAgente.create({
      data: { conversaId: conversa.id, papel: 'USER', conteudo: input.mensagem },
    });
    await tx.mensagemAgente.create({
      data: {
        conversaId: conversa.id,
        papel: 'ASSISTANT',
        conteudo: respostaTexto,
        tokensUsados,
      },
    });
  });

  return { resposta: respostaTexto, conversaId: conversa.id, tokensUsados };
}

export async function listarConversas(advogadoId: string) {
  return prisma.conversaAgente.findMany({
    where: { advogadoId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      canal: true,
      clienteNome: true,
      clienteIdentificador: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { mensagens: true } },
    },
  });
}

export async function getConversa(advogadoId: string, conversaId: string) {
  const conversa = await prisma.conversaAgente.findFirst({
    where: { id: conversaId, advogadoId },
    include: {
      mensagens: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, papel: true, conteudo: true, tokensUsados: true, createdAt: true },
      },
    },
  });

  if (!conversa) throw new HttpError(404, 'Conversa não encontrada');
  return conversa;
}
