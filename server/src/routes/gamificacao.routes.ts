import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/gamificacao.controller.js';

export const gamificacaoRouter = Router();

gamificacaoRouter.get('/ranking', ctrl.getRanking); // public

gamificacaoRouter.use(authenticate);

gamificacaoRouter.get('/tarefas', ctrl.listarTarefas);
gamificacaoRouter.post('/tarefas/:id/completar', ctrl.completarTarefa);
gamificacaoRouter.get('/conquistas', ctrl.getConquistas);
