import { z } from 'zod';

// ── Agenda ────────────────────────────────────────────────────────────────────

export const agendarSchema = z.object({
  titulo: z.string().min(1).max(200),
  inicio: z.string().min(1),  // ISO datetime: 2026-05-04T09:00:00
  fim: z.string().min(1),
  clienteNome: z.string().max(100).optional().nullable(),
  descricao: z.string().max(2000).optional().nullable(),
});
export type AgendarInput = z.infer<typeof agendarSchema>;

// ── Financeiro ────────────────────────────────────────────────────────────────

export const criarClienteAsaasSchema = z.object({
  nome: z.string().min(1).max(200),
  cpfCnpj: z.string().min(11).max(18),
  email: z.string().email().optional().nullable(),
  telefone: z.string().max(20).optional().nullable(),
});
export type CriarClienteAsaasInput = z.infer<typeof criarClienteAsaasSchema>;

export const gerarCobrancaSchema = z.object({
  clienteAsaasId: z.string().min(1),
  valor: z.number().positive(),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD'),
  descricao: z.string().max(500).optional().nullable(),
  tipo: z.enum(['PIX', 'BOLETO']).default('PIX'),
});
export type GerarCobrancaInput = z.infer<typeof gerarCobrancaSchema>;

// ── Controladoria ─────────────────────────────────────────────────────────────

export const solicitarDocsSchema = z.object({
  tipoCaso: z.string().min(1).max(200),
  clienteNome: z.string().min(1).max(100),
  descricao: z.string().max(1000).optional().nullable(),
});
export type SolicitarDocsInput = z.infer<typeof solicitarDocsSchema>;

export const atualizarDocumentoSchema = z.object({
  status: z.enum(['RECEBIDO', 'PROCESSANDO', 'PROCESSADO', 'ERRO']).optional(),
  resumoIA: z.string().max(2000).optional().nullable(),
});
export type AtualizarDocumentoInput = z.infer<typeof atualizarDocumentoSchema>;

// ── Agente ────────────────────────────────────────────────────────────────────

export const secretariaConversarSchema = z.object({
  modulo: z.enum(['AGENDA', 'FINANCEIRO', 'CONTROLADORIA']),
  mensagem: z.string().min(1).max(4000),
  conversaId: z.string().cuid().optional().nullable(),
  clienteNome: z.string().max(100).optional().nullable(),
});
export type SecretariaConversarInput = z.infer<typeof secretariaConversarSchema>;
