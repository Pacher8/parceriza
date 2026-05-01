import { z } from 'zod';

export const comprarTokensSchema = z.object({
  pacote: z.enum(['100', '500', '1000', '5000']),
});
export type ComprarTokensInput = z.infer<typeof comprarTokensSchema>;

export const sacarTokensSchema = z.object({
  quantidadeTokens: z.number().int().min(1000, 'Saque mínimo de 1.000 tokens (R$ 100,00)'),
  pixChave: z.string().min(1).max(200),
});
export type SacarTokensInput = z.infer<typeof sacarTokensSchema>;

export const usarIndicacaoSchema = z.object({
  codigo: z.string().min(1).max(50),
});

export const resgatarParceiroSchema = z.object({
  comprovanteJson: z.record(z.unknown()).optional(),
});

export const webhookParceiroSchema = z.object({
  advogadoId: z.string().optional(),
  oab: z.string().optional(),
  oabUf: z.string().optional(),
  regraId: z.string().min(1),
  comprovanteJson: z.record(z.unknown()).optional(),
}).refine((d) => d.advogadoId || (d.oab && d.oabUf), {
  message: 'Informe advogadoId ou oab+oabUf',
});
