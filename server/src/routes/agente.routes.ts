import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as agenteController from '../controllers/agente.controller.js';

export const agenteRouter = Router();

agenteRouter.use(authenticate);

agenteRouter.get('/config', agenteController.getConfig);
agenteRouter.put('/config', agenteController.atualizarConfig);
agenteRouter.post('/conversar', agenteController.conversar);
agenteRouter.get('/conversas', agenteController.listarConversas);
agenteRouter.get('/conversas/:id', agenteController.getConversa);
