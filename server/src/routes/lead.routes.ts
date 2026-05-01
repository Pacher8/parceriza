import { Router } from 'express';
import * as leadController from '../controllers/lead.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const leadRouter = Router();

leadRouter.use(authenticate);

leadRouter.post('/', leadController.criarLead);
leadRouter.get('/minhas', leadController.meusLeads);
leadRouter.get('/disponiveis', leadController.leadsDisponiveis);
leadRouter.patch('/:id/match', leadController.aceitarMatch);
leadRouter.patch('/:id/fechar', leadController.fecharLead);
