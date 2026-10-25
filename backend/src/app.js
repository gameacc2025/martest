// =============================================================
// App Builder
//
// Builds and configures the Fastify application.
// Separated from server.js so it can be used in tests without
// starting a real HTTP server (fastify.inject()).
//
// Plugin registration order matters:
//   1. Error handler  (must be first to catch all errors)
//   2. CORS           (must be before routes)
//   3. Auth plugin    (registers jwt + authenticate decorator)
//   4. Swagger        (must be before routes to auto-discover them)
//   5. Routes         (can now use fastify.authenticate)
// =============================================================

const fastify = require('fastify');
const { nodeEnv, frontendUrl, allowedOrigins } = require('./config/env');

async function buildApp() {
  const app = fastify({
    logger: {
      level: nodeEnv === 'development' ? 'debug' : 'info',
      ...(nodeEnv === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
    // Disable Fastify's default 'Bad Request' message on validation errors
    // (our error handler formats them consistently)
    ajv: {
      customOptions: {
        removeAdditional: true,  // strip unknown fields from request body
        useDefaults: true,       // apply schema defaults
        coerceTypes: true,       // coerce query string types (string "1" → number 1)
      },
    },
  });

  // ── 1. Error handler (must be first) ──────────────────────────
  // Register error handler with prefix strategy to catch all /api/v1 routes
  await app.register(require('./plugins/error-handler.plugin'), { prefix: '/api/v1' });

  // ── 2. CORS ───────────────────────────────────────────────────
  // Production: explicit allow-list (all three frontend origins —
  // ALLOWED_ORIGINS in backend/.env). Dev: reflect any origin.
  await app.register(require('@fastify/cors'), {
    origin: nodeEnv === 'production'
      ? (Array.isArray(allowedOrigins) && allowedOrigins.length ? allowedOrigins : [frontendUrl])
      : true,
    credentials: true,   // allow cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Security headers (helmet) ──────────────────────────────────
  // Sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
  // crossOriginResourcePolicy is relaxed to "cross-origin" so that
  // uploaded product images/documents served from /uploads can be
  // embedded by the separate website/company/admin frontend origins.
  await app.register(require('@fastify/helmet'), {
    global: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  });

  // ── Rate limiting (global default) ─────────────────────────────
  // Generic ceiling for the whole API to blunt scraping/DoS attempts.
  // Sensitive auth endpoints (login/register) get a much stricter
  // per-route limit — see auth.routes.js.
  await app.register(require('@fastify/rate-limit'), {
    max: 300,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  await app.register(require('@fastify/multipart'), {
    attachFieldsToBody: false,
    limits: {
      files: 1,
      fields: 10,
    },
  });

  // ── Static file serving for uploaded assets ───────────────────
  // Files saved by the products/settings modules live under
  // <cwd>/uploads and are exposed at /uploads/* (e.g. product images).
  // Ensure the directory exists at boot so @fastify/static doesn't warn
  // and can serve files created later at runtime.
  const path = require('path');
  const fs = require('fs');
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsRoot, { recursive: true });
  await app.register(require('@fastify/static'), {
    root: uploadsRoot,
    prefix: '/uploads/',
    decorateReply: false,
  });



  // ── 3. Auth plugin (jwt + authenticate decorator) ─────────────
  await app.register(require('./plugins/auth.plugin'));

  // ── 4. Swagger/OpenAPI documentation ──────────────────────────
  await app.register(require('./plugins/swagger.plugin'));

  // ── 5. Routes ─────────────────────────────────────────────────
  await app.register(require('./modules/auth/auth.routes'), { prefix: '/api/v1/auth' });
  await app.register(require('./modules/users/user.routes'), { prefix: '/api/v1/users' });
  await app.register(require('./modules/roles/role.routes'), { prefix: '/api/v1/roles' });
  await app.register(require('./modules/permissions/permission.routes'), { prefix: '/api/v1/permissions' });
  await app.register(require('./modules/admin/admin.routes'), { prefix: '/api/v1/admin' });
  await app.register(require('./modules/settings/settings.routes'), { prefix: '/api/v1/settings' });
  // NOTE: The legacy "orders" module was removed. There is no Order model in
  // the schema; buyer/seller interactions are modeled through the Inquiry
  // domain (see modules/inquiries). Keeping the dead module registered would
  // crash on any call and leaked the removed User.username field.
  await app.register(require('./modules/companies/company.routes'), { prefix: '/api/v1/companies' });
  await app.register(require('./modules/categories/category.routes'), { prefix: '/api/v1/categories' });
  await app.register(require('./modules/products/product.routes'), { prefix: '/api/v1/products' });
  await app.register(require('./modules/specification-library/specification-library.routes'), { prefix: '/api/v1/specification-library' });
  await app.register(require('./modules/inquiries/inquiry.routes'), { prefix: '/api/v1/inquiries' });
  await app.register(require('./modules/notifications/notification.routes'), { prefix: '/api/v1/settings/notifications' });

  // ── Health check (no auth) ────────────────────────────────────
  app.get('/health', {
    schema: { hide: true },   // hide from swagger if added later
  }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: nodeEnv,
  }));

  return app;
}

module.exports = buildApp;