import type { RequestHandler } from 'express';
import * as tokenSvc from '../services/token.service.js';
import * as tokensSvc from '../services/tokens.service.js';
import * as indicacoesSvc from '../services/indicacoes.service.js';
import * as parceirosSvc from '../services/parceiros-token.service.js';
import * as apresentacaoSvc from '../services/apresentacao.service.js';
import {
  comprarTokensSchema,
  sacarTokensSchema,
  usarIndicacaoSchema,
  resgatarParceiroSchema,
  webhookParceiroSchema,
} from '../schemas/tokens.schema.js';

// ── Saldo & Extrato ──────────────────────────────────────────────────────────

export const getSaldo: RequestHandler = async (req, res, next) => {
  try {
    const saldo = await tokenSvc.getSaldo(req.advogadoId!);
    res.json(saldo);
  } catch (err) { next(err); }
};

export const getExtrato: RequestHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const extrato = await tokensSvc.getExtrato(req.advogadoId!, page, limit);
    res.json(extrato);
  } catch (err) { next(err); }
};

// ── Compra ───────────────────────────────────────────────────────────────────

export const getPacotes: RequestHandler = (_req, res) => {
  res.json({ pacotes: tokensSvc.PACOTES });
};

export const comprarTokens: RequestHandler = async (req, res, next) => {
  try {
    const data = comprarTokensSchema.parse(req.body);
    const result = await tokensSvc.comprarTokens(req.advogadoId!, data);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const webhookAsaas: RequestHandler = async (req, res, next) => {
  try {
    const result = await tokensSvc.processarWebhookAsaas(req.body);
    res.json(result);
  } catch (err) { next(err); }
};

// ── Saque ────────────────────────────────────────────────────────────────────

export const sacarTokens: RequestHandler = async (req, res, next) => {
  try {
    const data = sacarTokensSchema.parse(req.body);
    const saque = await tokensSvc.solicitarSaque(req.advogadoId!, data);
    res.status(201).json({ saque });
  } catch (err) { next(err); }
};

export const listarSaques: RequestHandler = async (req, res, next) => {
  try {
    const saques = await tokensSvc.listarSaques(req.advogadoId!);
    res.json({ saques });
  } catch (err) { next(err); }
};

// ── Indicações ────────────────────────────────────────────────────────────────

export const getMeuCodigo: RequestHandler = async (req, res, next) => {
  try {
    const data = await indicacoesSvc.getMeuCodigo(req.advogadoId!);
    res.json(data);
  } catch (err) { next(err); }
};

export const usarCodigo: RequestHandler = async (req, res, next) => {
  try {
    const { codigo } = usarIndicacaoSchema.parse(req.body);
    const result = await indicacoesSvc.usarCodigo(req.advogadoId!, codigo);
    res.json(result);
  } catch (err) { next(err); }
};

export const listarIndicacoes: RequestHandler = async (req, res, next) => {
  try {
    const indicacoes = await indicacoesSvc.listarIndicacoes(req.advogadoId!);
    res.json({ indicacoes });
  } catch (err) { next(err); }
};

// ── Parceiros ─────────────────────────────────────────────────────────────────

export const listarParceiros: RequestHandler = async (_req, res, next) => {
  try {
    const parceiros = await parceirosSvc.listarParceiros();
    res.json({ parceiros });
  } catch (err) { next(err); }
};

export const resgatarRegra: RequestHandler = async (req, res, next) => {
  try {
    const data = resgatarParceiroSchema.parse(req.body);
    const result = await parceirosSvc.resgatarRegra(
      req.advogadoId!,
      req.params.regraId as string,
      data.comprovanteJson as Record<string, unknown> | undefined,
    );
    res.json(result);
  } catch (err) { next(err); }
};

export const webhookParceiro: RequestHandler = async (req, res, next) => {
  try {
    const chaveApi = req.headers['x-parceiro-key'] as string;
    if (!chaveApi) return next(new (await import('../middlewares/error.middleware.js')).HttpError(401, 'X-Parceiro-Key ausente'));
    const data = webhookParceiroSchema.parse(req.body);
    const result = await parceirosSvc.processarWebhookParceiro(chaveApi, data);
    res.json(result);
  } catch (err) { next(err); }
};

export const historicoParceiroAdvogado: RequestHandler = async (req, res, next) => {
  try {
    const historico = await parceirosSvc.getHistoricoAdvogado(req.advogadoId!);
    res.json({ historico });
  } catch (err) { next(err); }
};

// ── Apresentação ──────────────────────────────────────────────────────────────

export const gerarApresentacao: RequestHandler = async (req, res, next) => {
  try {
    const pdfBuffer = await apresentacaoSvc.gerarApresentacao(req.advogadoId!);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="apresentacao-parceriza.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};
