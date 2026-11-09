// =============================================================
// Auth Challenges Routes — Fastify route definitions
//
// All routes require authentication (handled by auth plugin).
// Mounted at /auth in app.js
// =============================================================

const controller = require('./authChallenges.controller');

/**
 * Auth Challenges Routes
 * @param {FastifyInstance} fastify
 */
async function authChallengesRoutes(fastify) {
  // All routes in this plugin require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /auth/challenges - Request new challenge
  fastify.post('/challenges', {
    schema: {
      tags: ['Auth Challenges'],
      summary: 'Request a new OTP challenge',
      description: 'Request a new challenge (SMS/Email) for password reset, phone/email verification, or MFA login.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['purpose', 'channel', 'destination'],
        properties: {
          purpose: { type: 'string', enum: ['PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION', 'LOGIN_MFA'] },
          channel: { type: 'string', enum: ['SMS', 'EMAIL'] },
          destination: { type: 'string', minLength: 3, maxLength: 255 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                challengeId: { type: 'integer' },
                expiresIn: { type: 'integer' },
                resendCooldown: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    handler: controller.requestChallengeHandler,
  });

  // POST /auth/challenges/verify - Verify challenge code
  fastify.post('/challenges/verify', {
    schema: {
      tags: ['Auth Challenges'],
      summary: 'Verify challenge code without consuming',
      description: 'Verify a challenge code to check validity without marking it as consumed.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['challengeId', 'code'],
        properties: {
          challengeId: { type: 'string', pattern: '^\\d+$' },
          code: { type: 'string', pattern: '^\\d{6}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                purpose: { type: 'string' },
                remainingAttempts: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    handler: controller.verifyChallengeHandler,
  });

  // POST /auth/challenges/consume - Consume challenge
  fastify.post('/challenges/consume', {
    schema: {
      tags: ['Auth Challenges'],
      summary: 'Consume challenge (verify + mark consumed)',
      description: 'Verify a challenge code and mark it as consumed. Final step for password reset, verification flows.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['challengeId', 'code'],
        properties: {
          challengeId: { type: 'string', pattern: '^\\d+$' },
          code: { type: 'string', pattern: '^\\d{6}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                consumed: { type: 'boolean' },
                purpose: { type: 'string' },
                userId: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    handler: controller.consumeChallengeHandler,
  });

  // GET /auth/challenges/me - List user's challenges
  fastify.get('/challenges/me', {
    schema: {
      tags: ['Auth Challenges'],
      summary: 'List current user\'s challenges',
      description: 'Get all challenges for the authenticated user for session management UI.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                challenges: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      purpose: { type: 'string' },
                      channel: { type: 'string' },
                      destinationMasked: { type: 'string' },
                      expiresAt: { type: 'string', format: 'date-time' },
                      attemptCount: { type: 'integer' },
                      maxAttempts: { type: 'integer' },
                      status: { type: 'string', enum: ['PENDING', 'CONSUMED', 'INVALIDATED', 'EXPIRED'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: controller.listMyChallengesHandler,
  });
}

module.exports = authChallengesRoutes;