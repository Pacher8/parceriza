import type { RequestHandler } from 'express';
import * as areaService from '../services/area.service.js';
import { listJobsQuerySchema } from '../schemas/marketplace.schema.js';

export const listAreas: RequestHandler = async (_req, res, next) => {
  try {
    const areas = await areaService.listAreas();
    res.json({ areas });
  } catch (err) {
    next(err);
  }
};

export const listJobsByArea: RequestHandler = async (req, res, next) => {
  try {
    const query = listJobsQuerySchema.parse(req.query);
    const jobs = await areaService.listJobsByArea(req.params['slug'] as string, query);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
};
