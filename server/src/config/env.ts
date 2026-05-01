import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY é obrigatória'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional().default('http://localhost:3000/api/secretaria/agenda/callback'),
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_BASE_URL: z.string().optional().default('https://sandbox.asaas.com/api/v3'),
  DATAJUD_API_KEY: z.string().optional().default('cDZwSXNkN3dLdzkwUGJsOA=='),
  DATAJUD_BASE_URL: z.string().optional().default('https://api-publica.datajud.cnj.jus.br'),
  JUDIT_API_KEY: z.string().optional(),
  TRIBUNAL_API_PROVIDER: z.enum(['datajud', 'judit']).optional().default('datajud'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('[env] invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
