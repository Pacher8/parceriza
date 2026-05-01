import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as tokensCtrl from '../controllers/tokens.controller.js';

export const tokensRouter = Router();

// Public webhook (called by Asaas after payment)
tokensRouter.post('/webhook-asaas', tokensCtrl.webhookAsaas);
// Public webhook (called by partners)
tokensRouter.post('/parceiros-webhook', tokensCtrl.webhookParceiro);

tokensRouter.use(authenticate);

// Saldo & Extrato
tokensRouter.get('/saldo', tokensCtrl.getSaldo);
tokensRouter.get('/extrato', tokensCtrl.getExtrato);
tokensRouter.get('/saques', tokensCtrl.listarSaques);

// Compra
tokensRouter.get('/pacotes', tokensCtrl.getPacotes);
tokensRouter.post('/comprar', tokensCtrl.comprarTokens);
tokensRouter.post('/sacar', tokensCtrl.sacarTokens);

// Indicações
tokensRouter.get('/indicacoes/meu-codigo', tokensCtrl.getMeuCodigo);
tokensRouter.post('/indicacoes/usar', tokensCtrl.usarCodigo);
tokensRouter.get('/indicacoes', tokensCtrl.listarIndicacoes);

// Parceiros
tokensRouter.get('/parceiros', tokensCtrl.listarParceiros);
tokensRouter.post('/parceiros/:regraId/resgatar', tokensCtrl.resgatarRegra);
tokensRouter.get('/parceiros-historico', tokensCtrl.historicoParceiroAdvogado);

// Apresentação
tokensRouter.post('/apresentacao', tokensCtrl.gerarApresentacao);
