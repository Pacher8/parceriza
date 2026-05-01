import { z } from 'zod';

export const atualizarConfigSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  personalidade: z.string().max(1000).optional().nullable(),
  tomDeVoz: z.string().max(500).optional().nullable(),
  temperatura: z.number().min(0).max(1).optional(),
  promptSistema: z.string().max(3000).optional().nullable(),
  modelo: z.enum(['CLAUDE_OPUS', 'CLAUDE_SONNET', 'CLAUDE_HAIKU', 'GPT_4', 'GEMINI']).optional(),
});
export type AtualizarConfigInput = z.infer<typeof atualizarConfigSchema>;

export const conversarSchema = z.object({
  mensagem: z.string().min(1).max(4000),
  conversaId: z.string().cuid().optional().nullable(),
  clienteNome: z.string().max(100).optional().nullable(),
});
export type ConversarInput = z.infer<typeof conversarSchema>;
