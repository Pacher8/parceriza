import { Router } from 'express';
import * as jobController from '../controllers/job.controller.js';
import * as ofertaController from '../controllers/oferta.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const jobRouter = Router();

jobRouter.get('/', jobController.listJobs);
jobRouter.post('/sugerir', authenticate, jobController.sugerirJob);
jobRouter.get('/:id', jobController.getJob);
jobRouter.post('/:id/ofertas', authenticate, ofertaController.criarOferta);
