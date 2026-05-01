import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import * as agendaService from './secretaria-agenda.service.js';
import * as financeiroService from './secretaria-financeiro.service.js';
import type { SecretariaConversarInput } from '../schemas/secretaria.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

type Modulo = 'AGENDA' | 'FINANCEIRO' | 'CONTROLADORIA';

async function buildContext(modulo: Modulo, advogadoId: string): Promise<string> {
  try {
    if (modulo === 'AGENDA') {
      const status = await agendaService.getStatus(advogadoId);
      if (!status.conectado) {
        return 'STATUS: Google Calendar não conectado. Oriente o usuário a conectar na aba Agenda.';
      }
      const disp = await agendaService.getDisponibilidade(advogadoId);
      const proxSlots = disp.slotsLivres.slice(0, 8);
      const linhasSlots = proxSlots.map((s) => `  - ${s.dia} ${s.inicio}–${s.fim}`).join('\n');
      const linhasEventos = disp.eventos
        .slice(0, 5)
        .map((e) => `  - ${e.titulo} em ${e.inicio}`)
        .join('\n');
      return [
        `SEMANA: ${disp.semana.inicio} a ${disp.semana.fim}`,
        `PRÓXIMOS SLOTS LIVRES:\n${linhasSlots || '  Nenhum disponível'}`,
        `EVENTOS AGENDADOS:\n${linhasEventos || '  Nenhum'}`,
      ].join('\n');
    }

    if (modulo === 'FINANCEIRO') {
      const { tabela, pixChave } = await financeiroService.getTabelaHonorarios(advogadoId);
      let tabelaStr = 'Nenhuma tabela configurada.';
      if (Array.isArray(tabela) && tabela.length > 0) {
        tabelaStr = tabela.map((t: { descricao: string; valor: number }) => `  - ${t.descricao}: R$ ${t.valor}`).join('\n');
      }
      return [`TABELA DE HONORÁRIOS:\n${tabelaStr}`, pixChave ? `CHAVE PIX: ${pixChave}` : ''].join('\n');
    }
  } catch {
    // contexto indisponível — continua sem ele
  }
  return '';
}

function buildSystemPrompt(
  modulo: Modulo,
  advogado: { nome: string; oab: string; oabUf: string },
  contexto: string,
): string {
  const base = `Você é a secretária virtual do escritório de advocacia de ${advogado.nome} (OAB ${advogado.oab}/${advogado.oabUf}).
Seja profissional, eficiente e cordial. Responda em português brasileiro.`;

  const moduloPrompts: Record<Modulo, string> = {
    AGENDA: `${base}

FUNÇÃO: Gerenciamento de agenda e compromissos.
- Consulte os slots disponíveis e sugira horários ao cliente
- Ajude a marcar, cancelar e reagendar compromissos
- Sempre confirme os detalhes (data, hora, tipo de atendimento) antes de finalizar
- Informe que o agendamento definitivo é feito pelo advogado ou pelo painel

CONTEXTO ATUAL:
${contexto}`,

    FINANCEIRO: `${base}

FUNÇÃO: Assistente financeiro do escritório.
- Informe valores de honorários com base na tabela configurada
- Auxilie na geração de cobranças Pix ou boleto via painel
- Informe status de pagamentos quando perguntado
- Nunca negocie valores sem autorização explícita do advogado

CONTEXTO ATUAL:
${contexto}`,

    CONTROLADORIA: `${base}

FUNÇÃO: Controle e gestão de documentos jurídicos.
- Identifique o tipo de caso e liste os documentos necessários
- Confirme o recebimento de documentos enviados pelo cliente
- Gere checklists de pendências e oriente sobre envio de documentos
- Mantenha o cliente informado sobre o status de cada documento`,
  };

  return moduloPrompts[modulo];
}

async function getOrCreateConversa(
  advogadoId: string,
  modulo: Modulo,
  conversaId: string | null | undefined,
  clienteNome: string | null | undefined,
) {
  if (conversaId) {
    const conv = await prisma.secretariaConversa.findFirst({
      where: { id: conversaId, advogadoId },
    });
    if (!conv) throw new HttpError(404, 'Conversa não encontrada');
    return conv;
  }
  return prisma.secretariaConversa.create({
    data: { advogadoId, modulo, clienteNome: clienteNome ?? null },
  });
}

export async function conversar(advogadoId: string, input: SecretariaConversarInput) {
  const advogado = await prisma.advogado.findUnique({
    where: { id: advogadoId },
    select: { nome: true, oab: true, oabUf: true },
  });
  if (!advogado) throw new HttpError(404, 'Advogado não encontrado');

  const conversa = await getOrCreateConversa(
    advogadoId,
    input.modulo,
    input.conversaId,
    input.clienteNome,
  );

  const [historico, contexto] = await Promise.all([
    prisma.secretariaMensagem.findMany({
      where: { conversaId: conversa.id },
      orderBy: { createdAt: 'asc' },
      select: { papel: true, conteudo: true },
    }),
    buildContext(input.modulo, advogadoId),
  ]);

  const messages: Anthropic.MessageParam[] = [
    ...historico.map((m) => ({
      role: m.papel.toLowerCase() as 'user' | 'assistant',
      content: m.conteudo,
    })),
    { role: 'user', content: input.mensagem },
  ];

  const systemPrompt = buildSystemPrompt(input.modulo, advogado, contexto);

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    temperature: 0.5,
    system: systemPrompt,
    messages,
  });

  const respostaTexto = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const tokensUsados = response.usage.input_tokens + response.usage.output_tokens;

  await prisma.$transaction(async (tx) => {
    await tx.secretariaMensagem.create({
      data: { conversaId: conversa.id, papel: 'USER', conteudo: input.mensagem },
    });
    await tx.secretariaMensagem.create({
      data: { conversaId: conversa.id, papel: 'ASSISTANT', conteudo: respostaTexto, tokensUsados },
    });
  });

  return { resposta: respostaTexto, conversaId: conversa.id, tokensUsados };
}

export async function listarConversas(advogadoId: string, modulo?: Modulo) {
  return prisma.secretariaConversa.findMany({
    where: { advogadoId, ...(modulo && { modulo }) },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      modulo: true,
      clienteNome: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { mensagens: true } },
    },
  });
}

export async function getConversa(advogadoId: string, conversaId: string) {
  const conversa = await prisma.secretariaConversa.findFirst({
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
