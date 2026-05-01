import type { RequestHandler } from 'express';
import * as gamificacaoSvc from '../services/gamificacao.service.js';

export const listarTarefas: RequestHandler = async (req, res, next) => {
  try {
    const tarefas = await gamificacaoSvc.listarTarefas(req.advogadoId!);
    res.json({ tarefas });
  } catch (err) { next(err); }
};

export const completarTarefa: RequestHandler = async (req, res, next) => {
  try {
    const result = await gamificacaoSvc.completarTarefa(req.advogadoId!, req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
};

export const getRanking: RequestHandler = async (_req, res, next) => {
  try {
    const ranking = await gamificacaoSvc.getRanking();
    res.json({ ranking });
  } catch (err) { next(err); }
};

export const getConquistas: RequestHandler = async (req, res, next) => {
  try {
    const conquistas = await gamificacaoSvc.getConquistas(req.advogadoId!);
    res.json({ conquistas });
  } catch (err) { next(err); }
};
