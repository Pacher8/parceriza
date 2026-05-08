import type { RequestHandler } from 'express';
import * as jobService from '../services/job.service.js';
import { listJobsQuerySchema, sugerirJobSchema } from '../schemas/marketplace.schema.js';

export const listJobs: RequestHandler = async (req, res, next) => {
  try {
    const query = listJobsQuerySchema.parse(req.query);
    const jobs = await jobService.listJobs(query);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
};

export const getJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await jobService.getJob(req.params['id'] as string);
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

export const sugerirJob: RequestHandler = async (req, res, next) => {
  try {
    const data = sugerirJobSchema.parse(req.body);
    const job = await jobService.sugerirJob(data, req.advogadoId!);
    res.status(201).json({ job, message: 'Sugestão recebida. Aguardando curadoria.' });
  } catch (err) {
    next(err);
  }
};
