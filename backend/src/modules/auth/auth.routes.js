// =============================================================
// Auth Routes
//
// Route map:
//   POST   /api/v1/auth/login                   → login (public)
//   POST   /api/v1/auth/refresh                 → refresh access token (cookie auth)
//   POST   /api/v1/auth/logout                  → logout current device (cookie auth)
//   POST   /api/v1/auth/logout-all              → logout all devices (access token)
//   GET    /api/v1/auth/me                      → current user profile + access (any role)
//   PATCH  /api/v1/auth/users/:id/password      → admin reset another user's password
//                                               (requires permission: users.update)
//
// NOTE: user creation/update/delete lives in the `users` module
//       (POST /api/users, etc.) which enforces the users.create permission.
// =============================================================

const ctrl = require('./auth.controller');
const { requirePermission } = require('../../middlewares/rbac');
const {
  loginBody,
  adminChangePasswordBody,
  loginResponse,
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

  fastify.post('/refresh', {
    onRequest: [fastify.authenticateRefresh],
    schema: { summary: 'Refresh access token using refresh token cookie', tags: ['Auth'] },
  }, ctrl.refresh);

  fastify.post('/logout', {
    onRequest: [fastify.authenticateRefresh],
    schema: { summary: 'Logout from current device', tags: ['Auth'] },
  }, ctrl.logout);

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
    preHandler: [requirePermission('users.reset_password')],
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