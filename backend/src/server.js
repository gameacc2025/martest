// =============================================================
// Server Entry Point
//
// Starts the HTTP server on 0.0.0.0 (all interfaces) so it is
// accessible inside Docker containers.
// =============================================================

const buildApp = require('./app');
const { port, nodeEnv } = require('./config/env');
const { processPendingDeliveries } = require('./modules/notifications/notification.delivery.service');
const { processInquiryLifecycle } = require('./modules/inquiries/inquiry.lifecycle.service');

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
  // Polls for PENDING EMAIL deliveries and processes them.
  // Only runs when a real email provider is configured; otherwise
  // deliveries remain PENDING until SMTP is configured.
  let workerRunning = false;
  async function runDeliveryWorker() {
    if (workerRunning) return; // Prevent overlapping runs
    workerRunning = true;
    try {
      await processPendingDeliveries({ limit: 100 });
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
}

start();
