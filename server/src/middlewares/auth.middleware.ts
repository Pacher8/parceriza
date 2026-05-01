import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './error.middleware.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Token de autenticação ausente'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    req.advogadoId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'Token inválido ou expirado'));
  }
};
