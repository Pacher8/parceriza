import { Router } from 'express';
import * as ofertaController from '../controllers/oferta.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const ofertaRouter = Router();

ofertaRouter.use(authenticate);

ofertaRouter.get('/minhas', ofertaController.minhasOfertas);
ofertaRouter.put('/:id', ofertaController.editarOferta);
ofertaRouter.delete('/:id', ofertaController.removerOferta);
