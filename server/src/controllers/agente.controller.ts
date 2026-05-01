import type { RequestHandler } from 'express';
import * as agenteService from '../services/agente.service.js';
import { atualizarConfigSchema, conversarSchema } from '../schemas/agente.schema.js';

export const getConfig: RequestHandler = async (req, res, next) => {
  try {
    const config = await agenteService.getConfig(req.advogadoId!);
    res.json({ config });
  } catch (err) {
    next(err);
  }
};

export const atualizarConfig: RequestHandler = async (req, res, next) => {
  try {
    const data = atualizarConfigSchema.parse(req.body);
    const config = await agenteService.atualizarConfig(req.advogadoId!, data);
    res.json({ config });
  } catch (err) {
    next(err);
  }
};

export const conversar: RequestHandler = async (req, res, next) => {
  try {
    const data = conversarSchema.parse(req.body);
    const result = await agenteService.conversar(req.advogadoId!, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const listarConversas: RequestHandler = async (req, res, next) => {
  try {
    const conversas = await agenteService.listarConversas(req.advogadoId!);
    res.json({ conversas });
  } catch (err) {
    next(err);
  }
};

export const getConversa: RequestHandler = async (req, res, next) => {
  try {
    const conversa = await agenteService.getConversa(req.advogadoId!, req.params.id as string);
    res.json({ conversa });
  } catch (err) {
    next(err);
  }
};
