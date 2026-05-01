import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { SolicitarDocsInput, AtualizarDocumentoInput } from '../schemas/secretaria.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function solicitarDocs(advogadoId: string, data: SolicitarDocsInput) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `Você é um controlador de documentos de um escritório de advocacia brasileiro.
Dado o tipo de caso jurídico, retorne uma lista de documentos necessários.
Responda SOMENTE com JSON válido, sem texto adicional.
Formato: {"documentos": [{"nome": "...", "descricao": "...", "obrigatorio": true}]}`,
    messages: [{
      role: 'user',
      content: `Tipo de caso: ${data.tipoCaso}\nCliente: ${data.clienteNome}${data.descricao ? `\nDescrição: ${data.descricao}` : ''}`,
    }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}';

  type DocItem = { nome: string; descricao: string; obrigatorio: boolean };
  let documentos: DocItem[] = [];
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    documentos = parsed.documentos ?? [];
  } catch {
    documentos = [];
  }

  return {
    tipoCaso: data.tipoCaso,
    clienteNome: data.clienteNome,
    documentos,
    tokensUsados: response.usage.input_tokens + response.usage.output_tokens,
  };
}

export async function listarDocumentos(advogadoId: string) {
  return prisma.documento.findMany({
    where: { advogadoId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nome: true,
      mimetype: true,
      tamanho: true,
      origem: true,
      status: true,
      resumoIA: true,
      metadados: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function atualizarDocumento(
  advogadoId: string,
  id: string,
  data: AtualizarDocumentoInput,
) {
  const doc = await prisma.documento.findFirst({ where: { id, advogadoId } });
  if (!doc) throw new HttpError(404, 'Documento não encontrado');

  return prisma.documento.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.resumoIA !== undefined && { resumoIA: data.resumoIA }),
    },
    select: { id: true, nome: true, status: true, resumoIA: true, updatedAt: true },
  });
}
