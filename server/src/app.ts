import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { router } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', router);

if (env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.use(notFoundHandler);
}

app.use(errorHandler);
