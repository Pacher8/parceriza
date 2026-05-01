import type { RequestHandler } from 'express';
import * as processosService from '../services/juridico-processos.service.js';
import * as monitorService from '../services/juridico-monitor.service.js';
import * as especialistasService from '../services/juridico-especialistas.service.js';
import {
  consultarProcessoSchema,
  criarMonitorSchema,
  criarEspecialistaSchema,
  consultarEspecialistaSchema,
  avaliarEspecialistaSchema,
} from '../schemas/juridico.schema.js';

// ── Processos ─────────────────────────────────────────────────────────────────

export const consultarProcesso: RequestHandler = async (req, res, next) => {
  try {
    const data = consultarProcessoSchema.parse(req.body);
    const result = await processosService.consultarProcesso(req.advogadoId!, data);
    res.json(result);
  } catch (err) { next(err); }
};

export const listarProcessos: RequestHandler = async (req, res, next) => {
  try {
    const processos = await processosService.listarProcessos(req.advogadoId!);
    res.json({ processos });
  } catch (err) { next(err); }
};

export const getProcesso: RequestHandler = async (req, res, next) => {
  try {
    const processo = await processosService.getProcesso(req.advogadoId!, req.params.id as string);
    res.json({ processo });
  } catch (err) { next(err); }
};

export const gerarResumo: RequestHandler = async (req, res, next) => {
  try {
    const resumo = await processosService.gerarResumo(req.advogadoId!, req.params.id as string);
    res.json({ resumo });
  } catch (err) { next(err); }
};

// ── Monitores ─────────────────────────────────────────────────────────────────

export const criarMonitor: RequestHandler = async (req, res, next) => {
  try {
    const data = criarMonitorSchema.parse(req.body);
    const monitor = await monitorService.criarMonitor(req.advogadoId!, data);
    res.status(201).json({ monitor });
  } catch (err) { next(err); }
};

export const listarMonitores: RequestHandler = async (req, res, next) => {
  try {
    const monitores = await monitorService.listarMonitores(req.advogadoId!);
    res.json({ monitores });
  } catch (err) { next(err); }
};

export const removerMonitor: RequestHandler = async (req, res, next) => {
  try {
    await monitorService.removerMonitor(req.advogadoId!, req.params.id as string);
    res.status(204).end();
  } catch (err) { next(err); }
};

// ── Especialistas ─────────────────────────────────────────────────────────────

export const listarEspecialistas: RequestHandler = async (req, res, next) => {
  try {
    const area = req.query.area as string | undefined;
    const especialistas = await especialistasService.listarEspecialistas(area);
    res.json({ especialistas });
  } catch (err) { next(err); }
};

export const getEspecialista: RequestHandler = async (req, res, next) => {
  try {
    const especialista = await especialistasService.getEspecialista(req.params.id as string);
    res.json({ especialista });
  } catch (err) { next(err); }
};

export const criarEspecialista: RequestHandler = async (req, res, next) => {
  try {
    const data = criarEspecialistaSchema.parse(req.body);
    const especialista = await especialistasService.criarEspecialista(req.advogadoId!, data);
    res.status(201).json({ especialista });
  } catch (err) { next(err); }
};

export const consultarEspecialista: RequestHandler = async (req, res, next) => {
  try {
    const data = consultarEspecialistaSchema.parse(req.body);
    const result = await especialistasService.consultarEspecialista(
      req.advogadoId!,
      req.params.id as string,
      data,
    );
    res.json(result);
  } catch (err) { next(err); }
};

export const avaliarEspecialista: RequestHandler = async (req, res, next) => {
  try {
    const data = avaliarEspecialistaSchema.parse(req.body);
    const avaliacao = await especialistasService.avaliarEspecialista(
      req.advogadoId!,
      req.params.id as string,
      data,
    );
    res.status(201).json({ avaliacao });
  } catch (err) { next(err); }
};

export const meusEspecialistas: RequestHandler = async (req, res, next) => {
  try {
    const especialistas = await especialistasService.meusEspecialistas(req.advogadoId!);
    res.json({ especialistas });
  } catch (err) { next(err); }
};
