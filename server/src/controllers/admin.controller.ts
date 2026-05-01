import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';
import { creditarTokens } from '../services/token.service.js';
import { HttpError } from '../middlewares/error.middleware.js';

export const getStats: RequestHandler = async (_req, res, next) => {
  try {
    const [totalAdvogados, totalJobs, totalLeads, totalParcerias, totalAnuncios, saldoAgregado] = await Promise.all([
      prisma.advogado.count({ where: { ativo: true } }),
      prisma.jobCatalogo.count({ where: { ativo: true, aprovado: true } }),
      prisma.lead.count(),
      prisma.parceria.count({ where: { status: 'ATIVA' } }),
      prisma.anuncio.count(),
      prisma.advogado.aggregate({ _sum: { saldoTokens: true } }),
    ]);
    res.json({
      totalAdvogados,
      totalJobs,
      totalLeads,
      totalParcerias,
      totalTokensCirculando: saldoAgregado._sum.saldoTokens ?? 0,
      totalAnuncios,
    });
  } catch (err) { next(err); }
};

export const getAgentesPendentes: RequestHandler = async (_req, res, next) => {
  try {
    const agentes = await prisma.agenteEspecialista.findMany({
      where: { aprovado: false, publico: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, nome: true, area: true, descricao: true,
        criador: { select: { nome: true, email: true } },
        createdAt: true,
      },
    });
    res.json({ agentes });
  } catch (err) { next(err); }
};

export const aprovarAgente: RequestHandler = async (req, res, next) => {
  try {
    const agente = await prisma.agenteEspecialista.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, aprovado: true, criadorId: true, nome: true },
    });
    if (!agente) throw new HttpError(404, 'Agente não encontrado');
    if (agente.aprovado) throw new HttpError(409, 'Agente já aprovado');

    await prisma.agenteEspecialista.update({
      where: { id: agente.id },
      data: { aprovado: true },
    });

    await creditarTokens(agente.criadorId, 300, 'BONUS', `Agente especialista aprovado: ${agente.nome}`, agente.id);
    res.json({ ok: true, mensagem: '300 tokens creditados ao criador' });
  } catch (err) { next(err); }
};

export const getSaquesPendentes: RequestHandler = async (_req, res, next) => {
  try {
    const saques = await prisma.saqueToken.findMany({
      where: { status: 'SOLICITADO' },
      orderBy: { createdAt: 'asc' },
      include: { advogado: { select: { nome: true, email: true } } },
    });
    res.json({ saques });
  } catch (err) { next(err); }
};

export const processarSaque: RequestHandler = async (req, res, next) => {
  try {
    const saque = await prisma.saqueToken.findUnique({ where: { id: req.params.id as string } });
    if (!saque) throw new HttpError(404, 'Saque não encontrado');
    if (saque.status !== 'SOLICITADO' && saque.status !== 'PROCESSANDO') {
      throw new HttpError(409, `Saque já está como ${saque.status}`);
    }
    const updated = await prisma.saqueToken.update({
      where: { id: saque.id },
      data: { status: 'PAGO' },
      select: { id: true, quantidadeTokens: true, valorReais: true, status: true, pixChave: true },
    });
    res.json({ saque: updated });
  } catch (err) { next(err); }
};
