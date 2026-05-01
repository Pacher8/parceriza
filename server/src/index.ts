import { app } from './app.js';
import { env } from './config/env.js';
import { startMonitorJob } from './jobs/monitor.job.js';

const server = app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  startMonitorJob();
});

const shutdown = (signal: string) => {
  console.log(`[server] received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
