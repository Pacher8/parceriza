import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const advogado = await authService.getMe(req.advogadoId!);
    res.json({ advogado });
  } catch (err) {
    next(err);
  }
};
