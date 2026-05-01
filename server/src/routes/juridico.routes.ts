import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/juridico.controller.js';

export const juridicoRouter = Router();

// ── Processos (autenticado) ────────────────────────────────────────────────────
juridicoRouter.post('/processos/consultar', authenticate, ctrl.consultarProcesso);
juridicoRouter.get('/processos', authenticate, ctrl.listarProcessos);
juridicoRouter.get('/processos/:id', authenticate, ctrl.getProcesso);
juridicoRouter.post('/processos/:id/resumo', authenticate, ctrl.gerarResumo);

// ── Monitores (autenticado) ────────────────────────────────────────────────────
juridicoRouter.post('/monitores', authenticate, ctrl.criarMonitor);
juridicoRouter.get('/monitores', authenticate, ctrl.listarMonitores);
juridicoRouter.delete('/monitores/:id', authenticate, ctrl.removerMonitor);

// ── Especialistas (listar/detalhe: público; criar/consultar/avaliar: autenticado) ──
juridicoRouter.get('/especialistas', ctrl.listarEspecialistas);
juridicoRouter.get('/especialistas/meus', authenticate, ctrl.meusEspecialistas);
juridicoRouter.get('/especialistas/:id', ctrl.getEspecialista);
juridicoRouter.post('/especialistas', authenticate, ctrl.criarEspecialista);
juridicoRouter.post('/especialistas/:id/consultar', authenticate, ctrl.consultarEspecialista);
juridicoRouter.post('/especialistas/:id/avaliar', authenticate, ctrl.avaliarEspecialista);
