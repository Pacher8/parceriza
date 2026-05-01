import { Router } from 'express';
import * as areaController from '../controllers/area.controller.js';

export const areaRouter = Router();

areaRouter.get('/', areaController.listAreas);
areaRouter.get('/:slug/jobs', areaController.listJobsByArea);
