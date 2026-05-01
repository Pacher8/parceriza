import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { HttpError } from './error.middleware.js';

export const adminAuth: RequestHandler = (req, _res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== env.ADMIN_SECRET) {
    return next(new HttpError(401, 'Acesso não autorizado. X-Admin-Key inválida.'));
  }
  next();
};
