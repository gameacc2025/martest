// =============================================================
// Auth Schemas — Fastify JSON Schema validation
//
// Fastify validates request body/query/params against these schemas
// BEFORE the handler runs. Invalid requests are rejected with 400
// automatically, without reaching the service layer.
//
// Why JSON Schema (not Zod/Joi):
//   - Fastify natively supports JSON Schema — zero extra dependencies
//   - Serialization schemas also speed up response (ajv serialization)
// =============================================================

// ── Request body schemas ──────────────────────────────────────

const loginBody = {
  type: 'object',
  required: ['phone', 'password'],
  additionalProperties: false,
  properties: {
    phone: {
      type: 'string',
      minLength: 1,
      maxLength: 20,
      description: 'Phone number (the sole login identity).',
    },
    password: { type: 'string', minLength: 1, maxLength: 128 },
    app: {
      type: 'string',
      enum: ['admin', 'company'],
      description: 'Which app is requesting login. If omitted, no role check is performed (backward compatible).',
    },
  },
};

const changePasswordBody = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  additionalProperties: false,
  properties: {
    currentPassword: { type: 'string', minLength: 1, maxLength: 128 },
    newPassword: { type: 'string', minLength: 6, maxLength: 128 },
  },
};

const adminChangePasswordBody = {
  type: 'object',
  required: ['newPassword'],
  additionalProperties: false,
  properties: {
    newPassword: { type: 'string', minLength: 6, maxLength: 128 },
  },
};

// ── Response schemas ──────────────────────────────────────────

// User = authentication identity only (no profile fields here).
const userResponse = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: ['string', 'null'] },
    phone: { type: 'string' },
    status: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

// Personal profile (Profile model) — present only when the user has one (null otherwise).
const profileResponse = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'integer' },
    firstName: { type: ['string', 'null'] },
    lastName: { type: ['string', 'null'] },
    avatar: { type: ['string', 'null'] },
    metadata: {},
  },
};

// AccessProfile — application context (STAFF | COMPANY | CUSTOMER).
const accessProfileResponse = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'integer' },
    type: { type: 'string' },
    companyId: { type: ['integer', 'null'] },
    isActive: { type: 'boolean' },
    company: {
      type: ['object', 'null'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        type: { type: ['string', 'null'] },
        status: { type: 'string' },
      },
    },
  },
};

const rolesResponse = {
  type: 'array',
  items: { type: 'string' },
};

const permissionsResponse = {
  type: 'array',
  items: { type: 'string' },
};

// Full authenticated context returned by /login and /me.
const authContextResponse = {
  type: 'object',
  properties: {
    user: userResponse,
    profile: profileResponse,
    accessProfile: accessProfileResponse,
    roles: rolesResponse,
    permissions: permissionsResponse,
  },
};

const loginResponse = {
  200: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          tokens: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'integer', description: 'Token expiry in seconds' },
            },
          },
          user: userResponse,
          profile: profileResponse,
          accessProfile: accessProfileResponse,
          roles: rolesResponse,
          permissions: permissionsResponse,
        },
      },
    },
  },
};

const meResponse = {
  200: {
    type: 'object',
    properties: { data: authContextResponse },
  },
};

module.exports = {
  loginBody,
  changePasswordBody,
  adminChangePasswordBody,
  loginResponse,
  meResponse,
  userResponse,
  profileResponse,
  accessProfileResponse,
  authContextResponse,
};
