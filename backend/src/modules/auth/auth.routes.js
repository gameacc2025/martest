// =============================================================
// Auth Routes
//
// Route map:
//   POST   /api/v1/auth/login                   → login (public)
//   POST   /api/v1/auth/refresh                 → refresh access token (cookie auth + origin guard)
//   POST   /api/v1/auth/logout                  → logout current device (cookie auth + origin guard)
//   POST   /api/v1/auth/logout-all              → logout all devices (access token)
//   POST   /api/v1/auth/handoff                 → mint one-time PKCE handoff code (access token)
//   POST   /api/v1/auth/handoff/redeem          → redeem handoff code for a session (origin guard)
//   GET    /api/v1/auth/me                      → current user profile + access (any role)
//   PATCH  /api/v1/auth/users/:id/password      → admin reset another user's password
//                                               (requires STAFF context + users.reset_password)
//
// NOTE: user creation/update/delete lives in the `users` module
//       (POST /api/users, etc.) which enforces the users.create permission.
// =============================================================

const ctrl = require('./auth.controller');
const { requirePermission, requireExactAccessType } = require('../../middlewares/rbac');
const { requireTrustedOrigin } = require('../../middlewares/originGuard');
const {
  loginBody,
  adminChangePasswordBody,
  handoffBody,
  handoffRedeemBody,
  loginResponse,
  refreshResponse,
  meResponse,
} = require('./auth.schemas');

async function authRoutes(fastify) {

  // ── Public routes (no authentication) ────────────────────────

  fastify.post('/login', {
    // Strict limit: brute-force protection. 10 attempts / 5 min / IP,
    // independent of the looser global API limit in app.js.
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '5 minutes',
      },
    },
    schema: {
      summary: 'Login with phone and password',
      tags: ['Auth'],
      body: loginBody,
      response: loginResponse,
    },
  }, ctrl.login);

  fastify.post('/register', {
    // Prevent scripted mass account creation.
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '10 minutes',
      },
    },
    schema: {
      summary: 'Register a new customer account (phone required, email optional)',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['phone', 'password', 'firstName', 'lastName'],
        properties: {
          phone: { type: 'string', minLength: 1, maxLength: 20 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
        },
      },
    },
  }, ctrl.register);

  fastify.post('/register-company', {
    // Prevent scripted mass account/company creation.
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '10 minutes',
      },
    },
    schema: {
      summary: 'Register a new company with manager (requires admin approval)',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['companyName', 'nationalId', 'registrationNumber', 'phone', 'address', 'managerFirstName', 'managerLastName', 'managerPhone', 'password'],
        properties: {
          companyName: { type: 'string', minLength: 1 },
          nameEn: { type: 'string' },
          nationalId: { type: 'string', minLength: 1 },
          registrationNumber: { type: 'string', minLength: 1 },
          companyEmail: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 1 },
          address: { type: 'string', minLength: 1 },
          website: { type: 'string' },
          logo: { type: 'string' },
          type: { type: 'string', enum: ['MANUFACTURER', 'IMPORTER', 'TELECOM_OPERATOR'] },
          managerFirstName: { type: 'string', minLength: 1 },
          managerLastName: { type: 'string', minLength: 1 },
          managerEmail: { type: 'string', format: 'email' },
          managerPhone: { type: 'string', minLength: 1, maxLength: 20 },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, ctrl.registerCompany);

  // ── Cookie-authenticated routes (use refresh token) ───────────
  // requireTrustedOrigin runs first: a cross-site request never gets
  // to touch the cookie. (Requests without an Origin header — non-
  // browser clients — are let through; they cannot ride cookies.)

  fastify.post('/refresh', {
    onRequest: [requireTrustedOrigin, fastify.authenticateRefresh],
    schema: {
      summary: 'Refresh access token using refresh token cookie',
      tags: ['Auth'],
      response: refreshResponse,
    },
  }, ctrl.refresh);

  fastify.post('/logout', {
    onRequest: [requireTrustedOrigin, fastify.authenticateRefresh],
    schema: { summary: 'Logout from current device', tags: ['Auth'] },
  }, ctrl.logout);

  // ── Cross-app session handoff (PKCE) ──────────────────────────
  // The panel generates a verifier, the website mints a 60s code bound
  // to SHA-256(verifier), the panel redeems code+verifier. No token
  // ever travels in a URL.

  fastify.post('/handoff', {
    onRequest: [fastify.authenticate],
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: {
      summary: 'Mint a one-time PKCE-bound code to open an admin/company panel',
      tags: ['Auth'],
      body: handoffBody,
    },
  }, ctrl.createHandoff);

  fastify.post('/handoff/redeem', {
    onRequest: [requireTrustedOrigin],
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: {
      summary: 'Exchange a handoff code + PKCE verifier for a session',
      tags: ['Auth'],
      body: handoffRedeemBody,
      response: loginResponse,
    },
  }, ctrl.redeemHandoff);

  // ── Access-token-authenticated routes ────────────────────────

  fastify.post('/logout-all', {
    onRequest: [fastify.authenticate],
    schema: { summary: 'Logout from all devices', tags: ['Auth'] },
  }, ctrl.logoutAll);

  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    schema: {
      summary: 'Get current user context (user, profile, accessProfile, roles, permissions)',
      tags: ['Auth'],
      response: meResponse,
    },
  }, ctrl.me);

  // ── Admin: reset another user's password ────────────────────
  fastify.patch('/users/:id/password', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('users.reset_password')],
    schema: {
      summary: 'Admin resets another user password',
      tags: ['Auth'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } },
      },
      body: adminChangePasswordBody,
    },
  }, ctrl.adminChangeUserPassword);
}

module.exports = authRoutes;