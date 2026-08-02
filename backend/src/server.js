// =============================================================
// Server Entry Point
//
// Starts the HTTP server on 0.0.0.0 (all interfaces) so it is
// accessible inside Docker containers.
// =============================================================

const buildApp = require('./app');
const { port } = require('./config/env');

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }
}

start();
