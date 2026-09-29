// =============================================================
// Origin Guard — CSRF protection for cookie-authenticated routes
//
// Routes that authenticate via the httpOnly refresh cookie
// (/refresh, /logout, /handoff/redeem) are the only CSRF surface:
// a cross-site page can trigger them with the victim's cookie but
// cannot read the response. Requiring a known Origin closes that.
//
// Browsers always send Origin on cross-origin and same-origin POST
// fetches. No Origin header => non-browser client (curl, tests) where
// cookie-riding CSRF is not the threat, so we let it through.
// =============================================================

const { allowedOrigins } = require('../config/env');

async function requireTrustedOrigin(request, reply) {
  const origin = request.headers.origin;
  if (!origin) return;

  const trusted = Array.isArray(allowedOrigins) ? allowedOrigins : [];
  if (!trusted.includes(origin)) {
    return reply.code(403).send({
      error: {
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'Origin not allowed.',
      },
    });
  }
}

module.exports = { requireTrustedOrigin };
