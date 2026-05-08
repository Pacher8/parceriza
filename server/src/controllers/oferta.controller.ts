import type { RequestHandler } from 'express';
import * as ofertaService from '../services/oferta.service.js';
import { criarOfertaSchema, editarOfertaSchema } from '../schemas/marketplace.schema.js';

export const criarOferta: RequestHandler = async (req, res, next) => {
  try {
    const data = criarOfertaSchema.parse(req.body);
    const oferta = await ofertaService.criarOferta(req.params['id'] as string, req.advogadoId!, data);
    res.status(201).json({ oferta });
  } catch (err) {
    next(err);
  }
};

export const editarOferta: RequestHandler = async (req, res, next) => {
  try {
    const data = editarOfertaSchema.parse(req.body);
    const oferta = await ofertaService.editarOferta(req.params['id'] as string, req.advogadoId!, data);
    res.json({ oferta });
  } catch (err) {
    next(err);
  }
};

export const removerOferta: RequestHandler = async (req, res, next) => {
  try {
    await ofertaService.removerOferta(req.params['id'] as string, req.advogadoId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const minhasOfertas: RequestHandler = async (req, res, next) => {
  try {
    const ofertas = await ofertaService.minhasOfertas(req.advogadoId!);
    res.json({ ofertas });
  } catch (err) {
    next(err);
  }
};
