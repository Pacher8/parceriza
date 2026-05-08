import { z } from 'zod';

// ── Processos ─────────────────────────────────────────────────────────────────

// Nota: campo "partes" não está indexado no DataJud — busca por nome/CPF
// não é suportada. Tribunais ativos: tjsc, trf4, stj.
export const consultarProcessoSchema = z.object({
  numero:        z.string().max(50).optional().nullable(),
  classe:        z.string().max(150).optional().nullable(),
  assunto:       z.string().max(150).optional().nullable(),
  vara:          z.string().max(200).optional().nullable(),
  grau:          z.enum(['JE', 'G1', 'G2', 'SUP', 'TURMA_REC']).optional().nullable(),
  dataInicio:    z.string().max(10).optional().nullable(),
  dataFim:       z.string().max(10).optional().nullable(),
  tribunal:      z.string().max(10).optional().nullable().default('tjsc'),
  multiTribunal: z.boolean().optional().default(false),
  tribunais:     z.array(z.string().max(10)).optional().nullable(),
}).refine(
  (d) => d.numero || d.classe || d.assunto || d.vara || d.grau || d.dataInicio || d.dataFim || d.multiTribunal,
  { message: 'Informe pelo menos um critério de busca' },
);
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
