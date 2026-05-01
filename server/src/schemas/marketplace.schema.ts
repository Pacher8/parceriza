import { z } from 'zod';
import { JobTipo, LeadStatus } from '../lib/enums.js';

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const listJobsQuerySchema = z.object({
  area: z.string().optional(),
  tipo: z.enum(JobTipo).optional(),
  busca: z.string().max(200).optional(),
});

export const sugerirJobSchema = z.object({
  titulo: z.string().min(5, 'Título muito curto').max(200),
  descricao: z.string().min(10, 'Descrição muito curta').max(2000).optional(),
  tipo: z.enum(JobTipo),
  areaId: z.string().min(1, 'Área obrigatória'),
});

// ── Ofertas ───────────────────────────────────────────────────────────────────

export const criarOfertaSchema = z.object({
  descricaoCustom: z.string().max(1000).optional(),
  valorEstimadoMin: z.number().positive().optional(),
  valorEstimadoMax: z.number().positive().optional(),
  comissaoPct: z.number().min(0).max(100).optional(),
}).refine(
  (d) => {
    if (d.valorEstimadoMin !== undefined && d.valorEstimadoMax !== undefined) {
      return d.valorEstimadoMax >= d.valorEstimadoMin;
    }
    return true;
  },
  { message: 'valorEstimadoMax deve ser maior que valorEstimadoMin', path: ['valorEstimadoMax'] },
);

export const editarOfertaSchema = z.object({
  descricaoCustom: z.string().max(1000).optional(),
  valorEstimadoMin: z.number().positive().optional(),
  valorEstimadoMax: z.number().positive().optional(),
  comissaoPct: z.number().min(0).max(100).optional(),
  ativo: z.boolean().optional(),
});

// ── Leads ─────────────────────────────────────────────────────────────────────

export const criarLeadSchema = z.object({
  jobId: z.string().min(1),
  descricao: z.string().min(20, 'Descreva o caso com pelo menos 20 caracteres').max(3000),
  estadoCliente: z.enum(UF_LIST, { errorMap: () => ({ message: 'UF inválida' }) }),
  valorEstimado: z.number().positive().optional(),
});

export const fecharLeadSchema = z.object({
  comissaoAcordada: z.number().min(0).max(100).optional(),
});

export const filtroLeadSchema = z.object({
  status: z.enum(LeadStatus).optional(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
export type SugerirJobInput = z.infer<typeof sugerirJobSchema>;
export type CriarOfertaInput = z.infer<typeof criarOfertaSchema>;
export type EditarOfertaInput = z.infer<typeof editarOfertaSchema>;
export type CriarLeadInput = z.infer<typeof criarLeadSchema>;
export type FecharLeadInput = z.infer<typeof fecharLeadSchema>;
