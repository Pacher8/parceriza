import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/secretaria.controller.js';

export const secretariaRouter = Router();

// Callback do OAuth Google — sem autenticação JWT (é redirect do Google)
secretariaRouter.get('/agenda/callback', ctrl.agendaCallback);

// Tudo mais requer JWT
secretariaRouter.use(authenticate);

// ── Agenda ─────────────────────────────────────────────────────────────────────
secretariaRouter.get('/agenda/status', ctrl.getAgendaStatus);
secretariaRouter.get('/agenda/auth-url', ctrl.getAgendaAuthUrl);
secretariaRouter.get('/agenda/disponibilidade', ctrl.getDisponibilidade);
secretariaRouter.get('/agenda/eventos', ctrl.listarEventos);
secretariaRouter.post('/agenda/agendar', ctrl.agendarEvento);

// ── Financeiro ─────────────────────────────────────────────────────────────────
secretariaRouter.get('/financeiro/honorarios', ctrl.getHonorarios);
secretariaRouter.post('/financeiro/cliente', ctrl.criarClienteAsaas);
secretariaRouter.post('/financeiro/cobranca', ctrl.gerarCobranca);
secretariaRouter.get('/financeiro/cobrancas', ctrl.listarCobrancas);
secretariaRouter.get('/financeiro/cobranca/:id', ctrl.getCobranca);

// ── Controladoria ──────────────────────────────────────────────────────────────
secretariaRouter.post('/controladoria/solicitar-docs', ctrl.solicitarDocs);
secretariaRouter.get('/controladoria/documentos', ctrl.listarDocumentos);
secretariaRouter.patch('/controladoria/documentos/:id', ctrl.atualizarDocumento);

// ── Agente (conversas) ─────────────────────────────────────────────────────────
secretariaRouter.post('/conversar', ctrl.conversar);
secretariaRouter.get('/conversas', ctrl.listarConversas);
secretariaRouter.get('/conversas/:id', ctrl.getConversa);
