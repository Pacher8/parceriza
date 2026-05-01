import type { RequestHandler } from 'express';
import * as leadService from '../services/lead.service.js';
import { criarLeadSchema, fecharLeadSchema } from '../schemas/marketplace.schema.js';

export const criarLead: RequestHandler = async (req, res, next) => {
  try {
    const data = criarLeadSchema.parse(req.body);
    const lead = await leadService.criarLead(data, req.advogadoId!);
    res.status(201).json({ lead });
  } catch (err) {
    next(err);
  }
};

export const meusLeads: RequestHandler = async (req, res, next) => {
  try {
    const leads = await leadService.meusLeads(req.advogadoId!);
    res.json({ leads });
  } catch (err) {
    next(err);
  }
};

export const leadsDisponiveis: RequestHandler = async (req, res, next) => {
  try {
    const leads = await leadService.leadsDisponiveis(req.advogadoId!);
    res.json({ leads });
  } catch (err) {
    next(err);
  }
};

export const aceitarMatch: RequestHandler = async (req, res, next) => {
  try {
    const lead = await leadService.aceitarMatch(req.params['id']!, req.advogadoId!);
    res.json({ lead });
  } catch (err) {
    next(err);
  }
};

export const fecharLead: RequestHandler = async (req, res, next) => {
  try {
    const data = fecharLeadSchema.parse(req.body);
    const lead = await leadService.fecharLead(req.params['id']!, req.advogadoId!, data);
    res.json({ lead });
  } catch (err) {
    next(err);
  }
};
