import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { areaRouter } from './area.routes.js';
import { jobRouter } from './job.routes.js';
import { ofertaRouter } from './oferta.routes.js';
import { leadRouter } from './lead.routes.js';
import { agenteRouter } from './agente.routes.js';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/areas', areaRouter);
router.use('/jobs', jobRouter);
router.use('/ofertas', ofertaRouter);
router.use('/leads', leadRouter);
router.use('/agente', agenteRouter);
