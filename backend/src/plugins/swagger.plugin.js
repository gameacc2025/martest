const fp = require('fastify-plugin');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const routeDocs = require('../utils/openapi-route-docs');

const PUBLIC_ROUTE_KEYS = new Set([
  'GET /api/v1/health',
  'POST /api/v1/auth/login',
  'POST /api/v1/auth/register',
  'POST /api/v1/auth/register-company',
  'POST /api/v1/auth/handoff/redeem',
  'GET /api/v1/categories',
  'GET /api/v1/categories/:id',
  'GET /api/v1/categories/:id/products',
  'GET /api/v1/categories/:id/subcategories',
  'GET /api/v1/categories/:id/subcategories/:subId',
  'GET /api/v1/products',
  'GET /api/v1/products/:id',
  'GET /api/v1/products/:id/price-history',
  'GET /api/v1/specification-library',
  'GET /api/v1/specification-library/all',
  'GET /api/v1/inquiries/subscription/payment/callback',
]);

const TAGS = [
  { name: 'Authentication', description: 'Login, refresh tokens, logout, and current-user identity endpoints.' },
  { name: 'Users', description: 'User profile, access assignment, and user lifecycle management.' },
  { name: 'Addresses', description: 'Customer-owned delivery and contact addresses.' },
  { name: 'Roles', description: 'Role lifecycle management and role permission assignment.' },
  { name: 'Permissions', description: 'Permission catalogue management and filtering.' },
  { name: 'Companies', description: 'Company profiles, status, settings, products, and statistics.' },
  { name: 'Categories', description: 'Product category browsing and administration.' },
  { name: 'Specification Library', description: 'Reusable product specification fields and templates.' },
  { name: 'Products', description: 'Product catalogue, lifecycle, pricing, images, and documents.' },
  { name: 'Inquiries', description: 'Inquiry requests, inquiry items, supplier responses, and statuses.' },
  { name: 'Notifications', description: 'Notification delivery, read state, and user notification preferences.' },
  { name: 'Settings', description: 'Authenticated user profile, avatar, password, and preferences settings.' },
  { name: 'Admin', description: 'Administrative dashboard and operational statistics.' },
];

const commonSchemas = {
  ErrorResponse: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'The request payload is invalid.' },
          debug: { type: 'string', description: 'Development-only internal error detail; never returned in production.' },
          stack: { type: 'string', description: 'Development-only stack trace; never returned in production.' },
          details: {
            oneOf: [
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Email is required.' },
                  },
                },
              },
              {
                type: 'object',
                additionalProperties: true,
              },
            ],
          },
        },
      },
    },
  },
  MessageResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
    },
  },
  PaginatedMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 125 },
      totalPages: { type: 'integer', example: 7 },
    },
  },
  PaginatedResponse: {
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'object', additionalProperties: true } },
      meta: { $ref: '#/components/schemas/PaginatedMeta' },
    },
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      data: { type: 'object', additionalProperties: true },
    },
  },
  AuthTokens: {
    type: 'object',
    properties: {
      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      expiresIn: { type: 'string', example: '15m' },
    },
    additionalProperties: true,
  },
  // User = authentication identity only. Personal fields live on Profile and
  // authorization context (type/companyId) lives on AccessProfile.
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      email: { type: 'string', format: 'email', example: 'admin@telecommarketplace.local' },
      phone: { type: 'string', nullable: true, example: null },
      status: { type: 'string', example: 'ACTIVE' },
    },
    additionalProperties: true,
  },
  Profile: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      firstName: { type: 'string', example: 'System' },
      lastName: { type: 'string', example: 'Administrator' },
      avatar: { type: 'string', nullable: true, example: null },
    },
    additionalProperties: true,
  },
  AccessProfile: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      type: { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'], example: 'STAFF' },
      companyId: { type: 'integer', nullable: true, example: null },
      isActive: { type: 'boolean', example: true },
    },
    additionalProperties: true,
  },
};


const defaultErrorResponses = {
  400: { description: 'Bad request or validation error.', $ref: '#/components/schemas/ErrorResponse' },
  401: { description: 'Authentication is required or the token is invalid.', $ref: '#/components/schemas/ErrorResponse' },
  403: { description: 'The authenticated user does not have the required permission or role.', $ref: '#/components/schemas/ErrorResponse' },
  404: { description: 'The requested resource was not found.', $ref: '#/components/schemas/ErrorResponse' },
  409: { description: 'The request conflicts with an existing or related record.', $ref: '#/components/schemas/ErrorResponse' },
  413: { description: 'The uploaded file or request payload exceeds the configured size limit.', $ref: '#/components/schemas/ErrorResponse' },
  429: { description: 'The caller exceeded a per-route or global rate limit. Fastify emits its native `{ statusCode, error, message }` envelope.', $ref: '#/components/schemas/ErrorResponse' },
  500: { description: 'Unexpected server error.', $ref: '#/components/schemas/ErrorResponse' },
};

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function normalizePath(url) {
  return url.replace(/\/$/, '') || '/';
}

function stripApiPrefix(url) {
  return url.replace(/^\/api\/v1(?=\/|$)/, '') || '/';
}

function getDoc(method, url) {
  const normalizedUrl = normalizePath(url);
  return routeDocs[`${method.toUpperCase()} ${normalizedUrl}`]
    || routeDocs[`${method.toUpperCase()} /api/v1${stripApiPrefix(normalizedUrl)}`];
}

function mergeResponseDocs(schemaResponses = {}, docResponses = {}) {
  return {
    ...docResponses,
    ...schemaResponses,
  };
}

async function swaggerPlugin(fastify) {
  await fastify.register(swagger, {
    mode: 'dynamic',
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Telecom Marketplace API',
        description: 'Production OpenAPI documentation for the Telecom Marketplace Fastify backend.',
        version: '1.0.0',
      },
      servers: [
        { url: '/api/v1', description: 'API v1 base path' },
      ],
      tags: TAGS,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter a JWT access token. Swagger UI will send it as `Authorization: Bearer <token>`.',
          },
          refreshCookie: {
            type: 'apiKey',
            in: 'cookie',
            name: 'refreshToken',
            description: 'HttpOnly refresh token cookie set by the login endpoint. Browser requests must include the trusted origin.',
          },
        },
        schemas: commonSchemas,
      },
    },
    transform: ({ schema, url, route }) => {
      const transformed = clone(schema) || {};
      const doc = getDoc(route.method, url);

      if (doc) {
        transformed.summary = doc.summary;
        transformed.description = doc.description;
        transformed.tags = doc.tags;
        transformed.security = Array.isArray(doc.security) ? doc.security : (doc.authRequired === false ? [] : [{ bearerAuth: [] }]);
        transformed.params = transformed.params || doc.params;
        transformed.querystring = transformed.querystring || doc.querystring;
        transformed.body = transformed.body || doc.body;
        transformed.consumes = transformed.consumes || doc.consumes;
        transformed.response = mergeResponseDocs(transformed.response, {
          ...(doc.responses || {}),
          ...(doc.authRequired === false ? {} : { 401: doc.responses?.[401] || defaultErrorResponses[401] }),
          ...(doc.permission ? { 403: doc.responses?.[403] || defaultErrorResponses[403] } : {}),
          ...(doc.includeNotFound === false ? {} : { 404: doc.responses?.[404] || defaultErrorResponses[404] }),
          500: doc.responses?.[500] || defaultErrorResponses[500],
        });

        transformed['x-authentication-required'] = doc.authRequired !== false;
        transformed['x-permission-required'] = doc.authRequired === false ? 'None' : (doc.permission || 'Authenticated user');
      }

      // Protected routes default to bearerAuth even when a route has no
      // dedicated prose entry yet. Explicit public routes are allow-listed;
      // cookie/PKCE routes can override this through doc.security above.
      if (!doc) {
        const normalizedUrl = normalizePath(url);
        const fullPath = normalizedUrl.startsWith('/api/v1') ? normalizedUrl : `/api/v1${normalizedUrl}`;
        const routeKey = `${String(route.method).toUpperCase()} ${fullPath}`;
        const isPublic = PUBLIC_ROUTE_KEYS.has(routeKey);
        if (!Array.isArray(transformed.security) || transformed.security.length === 0) {
          transformed.security = isPublic ? [] : [{ bearerAuth: [] }];
        }
        transformed['x-authentication-required'] = !isPublic;
        transformed['x-permission-required'] = isPublic
          ? 'None'
          : 'Authenticated user; see route-level AccessProfile and permission guards';
      }

      transformed.response = {
        ...defaultErrorResponses,
        ...(transformed.response || {}),
      };

      return { schema: transformed, url };
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}

module.exports = fp(swaggerPlugin, { name: 'swagger-plugin' });