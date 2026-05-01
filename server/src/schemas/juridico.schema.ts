import { z } from 'zod';

// ── Processos ─────────────────────────────────────────────────────────────────

export const consultarProcessoSchema = z.object({
  numero: z.string().max(50).optional().nullable(),
  cpf: z.string().max(14).optional().nullable(),
  cnpj: z.string().max(18).optional().nullable(),
  tribunal: z.string().max(10).optional().nullable().default('tjsc'),
}).refine((d) => d.numero || d.cpf || d.cnpj, {
  message: 'Informe pelo menos um critério: numero, cpf ou cnpj',
});
export type ConsultarProcessoInput = z.infer<typeof consultarProcessoSchema>;

// ── Monitores ─────────────────────────────────────────────────────────────────

export const criarMonitorSchema = z.object({
  documento: z.string().min(11).max(18),
  tipoDocumento: z.enum(['CPF', 'CNPJ']),
  nomeMonitorado: z.string().max(200).optional().nullable(),
});
export type CriarMonitorInput = z.infer<typeof criarMonitorSchema>;

// ── Especialistas ─────────────────────────────────────────────────────────────

export const criarEspecialistaSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().min(1).max(2000),
  area: z.string().min(1),
  promptSistema: z.string().min(1).max(5000),
  exemplos: z.array(z.object({ input: z.string(), output: z.string() })).optional(),
  precoTokens: z.number().int().min(0).default(0),
  publico: z.boolean().default(false),
});
export type CriarEspecialistaInput = z.infer<typeof criarEspecialistaSchema>;

export const consultarEspecialistaSchema = z.object({
  descricaoCaso: z.string().min(1).max(5000),
  conversaId: z.string().cuid().optional().nullable(),
});
export type ConsultarEspecialistaInput = z.infer<typeof consultarEspecialistaSchema>;

export const avaliarEspecialistaSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional().nullable(),
});
export type AvaliarEspecialistaInput = z.infer<typeof avaliarEspecialistaSchema>;
