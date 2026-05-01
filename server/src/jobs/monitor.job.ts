import cron from 'node-cron';
import { verificarTodosMonitores } from '../services/juridico-monitor.service.js';

// Runs every 6 hours: minute 0 of hours 0, 6, 12, 18
const SCHEDULE = '0 */6 * * *';

export function startMonitorJob(): void {
  cron.schedule(SCHEDULE, async () => {
    console.log(`[monitor-job] iniciando verificação às ${new Date().toISOString()}`);
    try {
      await verificarTodosMonitores();
    } catch (err) {
      console.error('[monitor-job] falha geral:', err instanceof Error ? err.message : err);
    }
  });
  console.log('[monitor-job] agendado (a cada 6h)');
}
