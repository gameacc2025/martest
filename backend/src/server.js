// =============================================================
// Server Entry Point
//
// Starts the HTTP server on 0.0.0.0 (all interfaces) so it is
// accessible inside Docker containers.
// =============================================================

const buildApp = require('./app');
const { port, nodeEnv } = require('./config/env');
const { processPendingDeliveries, processPendingSmsDeliveries } = require('./modules/notifications/notification.delivery.service');
const { processInquiryLifecycle } = require('./modules/inquiries/inquiry.lifecycle.service');
const { runOnce: runCmsScheduledPublish } = require('./workers/cms-scheduled-publish.worker');
const { runOnce: runSlaMonitor } = require('./workers/sla-monitor.worker');

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }

  // ── Delivery worker ──────────────────────────────────────────
  // Polls pending EMAIL and SMS outbox deliveries. Each channel only sends
  // when its real provider is configured; otherwise rows remain pending.
  let workerRunning = false;
  async function runDeliveryWorker() {
    if (workerRunning) return; // Prevent overlapping runs
    workerRunning = true;
    try {
      await Promise.all([
        processPendingDeliveries({ limit: 100 }),
        processPendingSmsDeliveries({ limit: 100 }),
      ]);
    } catch (err) {
      app.log.error(err, 'Delivery worker error');
    } finally {
      workerRunning = false;
    }
  }

  const pollInterval = parseInt(process.env.NOTIFICATION_POLL_INTERVAL_MS, 10) || 5000;
  if (nodeEnv !== 'test') {
    setInterval(runDeliveryWorker, pollInterval);
    app.log.info(`Delivery worker started — polling every ${pollInterval}ms`);
  }

  // ── Inquiry lifecycle worker ────────────────────────────────
  // Publishes SUBMITTED inquiries when publishDate is due and expires OPEN
  // inquiries with autoClose enabled once their response deadline passes.
  let inquiryWorkerRunning = false;
  async function runInquiryLifecycleWorker() {
    if (inquiryWorkerRunning) return;
    inquiryWorkerRunning = true;
    try {
      const result = await processInquiryLifecycle({ limit: 100 });
      if (result.published || result.expired) {
        app.log.info(result, 'Inquiry lifecycle transitions processed');
      }
    } catch (err) {
      app.log.error(err, 'Inquiry lifecycle worker error');
    } finally {
      inquiryWorkerRunning = false;
    }
  }

  const inquiryPollInterval = parseInt(process.env.INQUIRY_LIFECYCLE_POLL_INTERVAL_MS, 10) || 15000;
  if (nodeEnv !== 'test') {
    setInterval(runInquiryLifecycleWorker, inquiryPollInterval);
    app.log.info(`Inquiry lifecycle worker started — polling every ${inquiryPollInterval}ms`);
  }
  setImmediate(runInquiryLifecycleWorker);

  // Run once immediately on startup
  setImmediate(runDeliveryWorker);

  // ── CMS Scheduled Publish worker ───────────────────────────────
  // Auto-publishes SCHEDULED articles when their scheduledAt <= now.
  let cmsScheduledWorkerRunning = false;
  async function runCmsScheduledWorker() {
    if (cmsScheduledWorkerRunning) return;
    cmsScheduledWorkerRunning = true;
    try {
      const result = await runCmsScheduledPublish();
      if (result.published) {
        app.log.info(result, 'CMS scheduled articles published');
      }
    } catch (err) {
      app.log.error(err, 'CMS scheduled publish worker error');
    } finally {
      cmsScheduledWorkerRunning = false;
    }
  }

  const cmsScheduledPollInterval = parseInt(process.env.CMS_SCHEDULED_WORKER_INTERVAL_MS, 10) || 60000;
  if (nodeEnv !== 'test') {
    setInterval(runCmsScheduledWorker, cmsScheduledPollInterval);
    app.log.info(`CMS scheduled publish worker started — polling every ${cmsScheduledPollInterval}ms`);
  }
  setImmediate(runCmsScheduledWorker);

  // ── SLA Monitor worker ───────────────────────────────────────────
  // Monitors SLA deadlines, triggers escalations, and updates ticket statuses
  let slaMonitorWorkerRunning = false;
  async function runSlaMonitorWorker() {
    if (slaMonitorWorkerRunning) return;
    slaMonitorWorkerRunning = true;
    try {
      const result = await runSlaMonitor();
      if (result.escalated || result.warned || result.breached) {
        app.log.info(result, 'SLA escalations and warnings processed');
      }
    } catch (err) {
      app.log.error(err, 'SLA monitor worker error');
    } finally {
      slaMonitorWorkerRunning = false;
    }
  }

  const slaMonitorPollInterval = parseInt(process.env.SLA_WORKER_INTERVAL_MS, 10) || 300000;
  if (nodeEnv !== 'test') {
    setInterval(runSlaMonitorWorker, slaMonitorPollInterval);
    app.log.info(`SLA monitor worker started — polling every ${slaMonitorPollInterval}ms`);
  }
  setImmediate(runSlaMonitorWorker);
}

start();
