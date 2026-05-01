import type { RequestHandler } from 'express';
import * as agendaService from '../services/secretaria-agenda.service.js';
import * as financeiroService from '../services/secretaria-financeiro.service.js';
import * as controladoriaService from '../services/secretaria-controladoria.service.js';
import * as agenteService from '../services/secretaria-agente.service.js';
import {
  agendarSchema,
  criarClienteAsaasSchema,
  gerarCobrancaSchema,
  solicitarDocsSchema,
  atualizarDocumentoSchema,
  secretariaConversarSchema,
} from '../schemas/secretaria.schema.js';
import { env } from '../config/env.js';

// ── Agenda ────────────────────────────────────────────────────────────────────

export const getAgendaStatus: RequestHandler = async (req, res, next) => {
  try {
    const status = await agendaService.getStatus(req.advogadoId!);
    res.json(status);
  } catch (err) { next(err); }
};

export const getAgendaAuthUrl: RequestHandler = async (req, res, next) => {
  try {
    const url = agendaService.getAuthUrl(req.advogadoId!);
    res.json({ url });
  } catch (err) { next(err); }
};

export const agendaCallback: RequestHandler = async (req, res, next) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return next(new Error('Parâmetros inválidos no callback'));
    await agendaService.handleCallback(code, state);
    res.redirect(`${env.CLIENT_ORIGIN}/secretaria?tab=agenda&connected=true`);
  } catch (err) { next(err); }
};

export const getDisponibilidade: RequestHandler = async (req, res, next) => {
  try {
    const data = await agendaService.getDisponibilidade(req.advogadoId!);
    res.json(data);
  } catch (err) { next(err); }
};

export const agendarEvento: RequestHandler = async (req, res, next) => {
  try {
    const data = agendarSchema.parse(req.body);
    const evento = await agendaService.agendar(req.advogadoId!, data);
    res.status(201).json({ evento });
  } catch (err) { next(err); }
};

export const listarEventos: RequestHandler = async (req, res, next) => {
  try {
    const eventos = await agendaService.listarEventos(req.advogadoId!);
    res.json({ eventos });
  } catch (err) { next(err); }
};

// ── Financeiro ────────────────────────────────────────────────────────────────

export const criarClienteAsaas: RequestHandler = async (req, res, next) => {
  try {
    const data = criarClienteAsaasSchema.parse(req.body);
    const cliente = await financeiroService.criarCliente(data);
    res.status(201).json({ cliente });
  } catch (err) { next(err); }
};

export const gerarCobranca: RequestHandler = async (req, res, next) => {
  try {
    const data = gerarCobrancaSchema.parse(req.body);
    const cobranca = await financeiroService.gerarCobranca(data);
    res.status(201).json({ cobranca });
  } catch (err) { next(err); }
};

export const listarCobrancas: RequestHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const result = await financeiroService.listarCobrancas({ limit, offset });
    res.json(result);
  } catch (err) { next(err); }
};

export const getCobranca: RequestHandler = async (req, res, next) => {
  try {
    const cobranca = await financeiroService.getCobranca(req.params.id as string);
    res.json({ cobranca });
  } catch (err) { next(err); }
};

export const getHonorarios: RequestHandler = async (req, res, next) => {
  try {
    const data = await financeiroService.getTabelaHonorarios(req.advogadoId!);
    res.json(data);
  } catch (err) { next(err); }
};

// ── Controladoria ─────────────────────────────────────────────────────────────

export const solicitarDocs: RequestHandler = async (req, res, next) => {
  try {
    const data = solicitarDocsSchema.parse(req.body);
    const result = await controladoriaService.solicitarDocs(req.advogadoId!, data);
    res.json(result);
  } catch (err) { next(err); }
};

export const listarDocumentos: RequestHandler = async (req, res, next) => {
  try {
    const documentos = await controladoriaService.listarDocumentos(req.advogadoId!);
    res.json({ documentos });
  } catch (err) { next(err); }
};

export const atualizarDocumento: RequestHandler = async (req, res, next) => {
  try {
    const data = atualizarDocumentoSchema.parse(req.body);
    const doc = await controladoriaService.atualizarDocumento(req.advogadoId!, req.params.id as string, data);
    res.json({ documento: doc });
  } catch (err) { next(err); }
};

// ── Agente ────────────────────────────────────────────────────────────────────

export const conversar: RequestHandler = async (req, res, next) => {
  try {
    const data = secretariaConversarSchema.parse(req.body);
    const result = await agenteService.conversar(req.advogadoId!, data);
    res.json(result);
  } catch (err) { next(err); }
};

export const listarConversas: RequestHandler = async (req, res, next) => {
  try {
    const modulo = req.query.modulo as 'AGENDA' | 'FINANCEIRO' | 'CONTROLADORIA' | undefined;
    const conversas = await agenteService.listarConversas(req.advogadoId!, modulo);
    res.json({ conversas });
  } catch (err) { next(err); }
};

export const getConversa: RequestHandler = async (req, res, next) => {
  try {
    const conversa = await agenteService.getConversa(req.advogadoId!, req.params.id as string);
    res.json({ conversa });
  } catch (err) { next(err); }
};
