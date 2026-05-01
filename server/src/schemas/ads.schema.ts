import { z } from 'zod';

export const criarAnuncioSchema = z.object({
  titulo: z.string().min(1).max(100),
  descricao: z.string().min(1).max(500),
  mediaUrl: z.string().url().optional().nullable(),
  modelo: z.enum(['CPC', 'CPM']),
  posicionamento: z.enum(['DESTAQUE_JOB', 'DESTAQUE_AREA', 'BANNER_BUSCA']),
  jobId: z.string().cuid().optional().nullable(),
  areaId: z.string().cuid().optional().nullable(),
  tokensLance: z.number().int().min(1).max(10000),
  orcamentoTokens: z.number().int().min(10),
  inicioEm: z.string().datetime().optional().nullable(),
  fimEm: z.string().datetime().optional().nullable(),
}).refine((d) => {
  if (d.posicionamento === 'DESTAQUE_JOB' && !d.jobId) return false;
  if (d.posicionamento === 'DESTAQUE_AREA' && !d.areaId) return false;
  return true;
}, { message: 'jobId é obrigatório para DESTAQUE_JOB; areaId para DESTAQUE_AREA' });
export type CriarAnuncioInput = z.infer<typeof criarAnuncioSchema>;

export const editarAnuncioSchema = z.object({
  titulo: z.string().min(1).max(100).optional(),
  descricao: z.string().min(1).max(500).optional(),
  mediaUrl: z.string().url().optional().nullable(),
  tokensLance: z.number().int().min(1).max(10000).optional(),
  orcamentoTokens: z.number().int().min(10).optional(),
  inicioEm: z.string().datetime().optional().nullable(),
  fimEm: z.string().datetime().optional().nullable(),
});
export type EditarAnuncioInput = z.infer<typeof editarAnuncioSchema>;

export const statusAnuncioSchema = z.object({
  status: z.enum(['ATIVO', 'PAUSADO', 'ENCERRADO']),
});
