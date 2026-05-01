import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/ads.controller.js';

export const adsRouter = Router();

// Public
adsRouter.get('/feed', ctrl.getFeed);
adsRouter.get('/stats', ctrl.getStats);

// Authenticated
adsRouter.use(authenticate);
adsRouter.post('/', ctrl.criar);
adsRouter.get('/meus', ctrl.meusAnuncios);
adsRouter.put('/:id', ctrl.editar);
adsRouter.patch('/:id/status', ctrl.atualizarStatus);
adsRouter.post('/:id/click', ctrl.registrarClique);
