import { z } from 'zod';

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  nome: z.string().min(2, 'Nome muito curto').max(200),
  oab: z.string().regex(/^\d{4,6}$/, 'OAB inválida — somente dígitos (4–6 caracteres)'),
  oabUf: z.enum(UF_LIST, { errorMap: () => ({ message: 'UF inválida' }) }),
  telefone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
