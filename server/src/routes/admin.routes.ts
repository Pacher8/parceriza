import { Router } from 'express';
import { adminAuth } from '../middlewares/admin.middleware.js';
import * as ctrl from '../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.use(adminAuth);

adminRouter.get('/stats', ctrl.getStats);
adminRouter.get('/agentes-pendentes', ctrl.getAgentesPendentes);
adminRouter.patch('/agentes/:id/aprovar', ctrl.aprovarAgente);
adminRouter.get('/saques-pendentes', ctrl.getSaquesPendentes);
adminRouter.patch('/saques/:id/processar', ctrl.processarSaque);
