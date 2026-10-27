// Dedicated notification outbox worker. Run as one worker replica unless delivery
// claiming is upgraded to an atomic SKIP LOCKED lease for multi-replica deployments.
const deliveryService = require('../modules/notifications/notification.delivery.service');
const prisma = require('../config/db');

const intervalMs = Math.max(1000, Number(process.env.NOTIFICATION_WORKER_INTERVAL_MS || process.env.NOTIFICATION_POLL_INTERVAL_MS) || 5000);
const batchSize = Math.min(500, Math.max(1, Number(process.env.NOTIFICATION_WORKER_BATCH_SIZE) || 100));
let stopping = false;

async function runOnce() {
  const [email, sms] = await Promise.all([
    deliveryService.processPendingDeliveries({ limit: batchSize }),
    deliveryService.processPendingSmsDeliveries({ limit: batchSize }),
  ]);
  const result = { email, sms };
  if ((email.processed || 0) + (sms.processed || 0) > 0) {
    console.log('[notification-worker] batch completed', JSON.stringify(result));
  }
  return result;
}

async function main() {
  console.log(`[notification-worker] started; interval=${intervalMs}ms batch=${batchSize}`);
  while (!stopping) {
    const startedAt = Date.now();
    try {
      await runOnce();
    } catch (error) {
      console.error('[notification-worker] batch failed', error?.message || error);
    }
    if (!stopping) {
      const waitMs = Math.max(0, intervalMs - (Date.now() - startedAt));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  await prisma.$disconnect();
  console.log('[notification-worker] stopped');
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[notification-worker] received ${signal}; stopping after current batch`);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

main().catch(async (error) => {
  console.error('[notification-worker] fatal error', error?.message || error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
