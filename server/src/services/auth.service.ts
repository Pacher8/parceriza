import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { RegisterInput } from '../schemas/auth.schema.js';

const SALT_ROUNDS = 12;

const advogadoPublicSelect = {
  id: true,
  email: true,
  nome: true,
  oab: true,
  oabUf: true,
  telefone: true,
  bio: true,
  avatarUrl: true,
  saldoTokens: true,
  ativo: true,
  plano: { select: { codigo: true, nome: true, preco: true } },
  createdAt: true,
  updatedAt: true,
} as const;

function signToken(advogadoId: string): string {
  return jwt.sign({ sub: advogadoId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function register(data: RegisterInput) {
  const [emailExists, oabExists] = await Promise.all([
    prisma.advogado.findUnique({ where: { email: data.email }, select: { id: true } }),
    prisma.advogado.findUnique({
      where: { oab_oabUf: { oab: data.oab, oabUf: data.oabUf } },
      select: { id: true },
    }),
  ]);

  if (emailExists) throw new HttpError(409, 'E-mail já cadastrado');
  if (oabExists) throw new HttpError(409, 'OAB já cadastrada nesta UF');

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const advogado = await prisma.advogado.create({
    data: {
      email: data.email,
      password: hashedPassword,
      nome: data.nome,
      oab: data.oab,
      oabUf: data.oabUf,
      telefone: data.telefone,
    },
    select: advogadoPublicSelect,
  });

  return { token: signToken(advogado.id), advogado };
}

export async function login(email: string, password: string) {
  const advogado = await prisma.advogado.findUnique({ where: { email } });

  if (!advogado) throw new HttpError(401, 'Credenciais inválidas');
  if (!advogado.ativo) throw new HttpError(403, 'Conta desativada');

  const valid = await bcrypt.compare(password, advogado.password);
  if (!valid) throw new HttpError(401, 'Credenciais inválidas');

  const advogadoPublic = await prisma.advogado.findUniqueOrThrow({
    where: { id: advogado.id },
    select: advogadoPublicSelect,
  });

  return { token: signToken(advogado.id), advogado: advogadoPublic };
}

export async function getMe(advogadoId: string) {
  const advogado = await prisma.advogado.findUnique({
    where: { id: advogadoId },
    select: advogadoPublicSelect,
  });

  if (!advogado) throw new HttpError(404, 'Usuário não encontrado');
  return advogado;
}
