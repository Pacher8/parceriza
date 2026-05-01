import type { RequestHandler } from 'express';
import * as adsService from '../services/ads.service.js';
import { criarAnuncioSchema, editarAnuncioSchema, statusAnuncioSchema } from '../schemas/ads.schema.js';

export const criar: RequestHandler = async (req, res, next) => {
  try {
    const data = criarAnuncioSchema.parse(req.body);
    const anuncio = await adsService.criar(req.advogadoId!, data);
    res.status(201).json({ anuncio });
  } catch (err) { next(err); }
};

export const meusAnuncios: RequestHandler = async (req, res, next) => {
  try {
    const anuncios = await adsService.meusAnuncios(req.advogadoId!);
    res.json({ anuncios });
  } catch (err) { next(err); }
};

export const editar: RequestHandler = async (req, res, next) => {
  try {
    const data = editarAnuncioSchema.parse(req.body);
    const anuncio = await adsService.editar(req.advogadoId!, req.params.id as string, data);
    res.json({ anuncio });
  } catch (err) { next(err); }
};

export const atualizarStatus: RequestHandler = async (req, res, next) => {
  try {
    const { status } = statusAnuncioSchema.parse(req.body);
    const anuncio = await adsService.atualizarStatus(req.advogadoId!, req.params.id as string, status);
    res.json({ anuncio });
  } catch (err) { next(err); }
};

export const getFeed: RequestHandler = async (req, res, next) => {
  try {
    const { posicionamento, jobId, areaId, limite } = req.query as Record<string, string>;
    const anuncios = await adsService.getFeed({
      posicionamento,
      jobId,
      areaId,
      limite: limite ? parseInt(limite) : 3,
    });
    res.json({ anuncios });
  } catch (err) { next(err); }
};

export const registrarClique: RequestHandler = async (req, res, next) => {
  try {
    const result = await adsService.registrarClique(req.advogadoId!, req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
};

export const getStats: RequestHandler = async (_req, res, next) => {
  try {
    const stats = await adsService.getStats();
    res.json(stats);
  } catch (err) { next(err); }
};
