// =============================================================
// Auth Challenges Controller — HTTP handlers for challenge flows
//
// Endpoints:
//   POST   /auth/challenges          - Request new challenge (authenticated)
//   POST   /auth/challenges/verify   - Verify challenge code (authenticated)
//   POST   /auth/challenges/consume  - Consume challenge (authenticated)
//   GET    /auth/challenges/me       - List user's challenges (authenticated)
// =============================================================

const service = require('./authChallenges.service');
const { createError, getClientIp, validateBody } = require('./authChallenges.utils');

// Request body validation schemas
const REQUEST_CHALLENGE_SCHEMA = {
  purpose: { required: true, type: 'string', enum: ['PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION', 'LOGIN_MFA'] },
  channel: { required: true, type: 'string', enum: ['SMS', 'EMAIL'] },
  destination: { required: true, type: 'string', minLength: 3, maxLength: 255 },
};

const VERIFY_CONSUME_SCHEMA = {
  challengeId: { required: true, type: 'string', pattern: /^\d+$/ },
  code: { required: true, type: 'string', minLength: 6, maxLength: 6, pattern: /^\d{6}$/ },
};

/**
 * POST /auth/challenges
 * Request a new OTP challenge for the authenticated user.
 * Body: { purpose, channel, destination }
 */
async function requestChallengeHandler(request, reply) {
  const userId = request.user.id;
  const ipAddress = getClientIp(request);

  // Validate body
  const validation = validateBody(request.body, REQUEST_CHALLENGE_SCHEMA);
  if (!validation.valid) {
    throw createError(400, 'VALIDATION_ERROR', 'داده‌های ورودی نامعتبر است.', { errors: validation.errors });
  }

  const { purpose, channel, destination } = request.body;

  const result = await service.requestChallenge({ userId, purpose, channel, destination, ipAddress });

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/challenges/verify
 * Verify a challenge code without consuming it.
 * Body: { challengeId, code }
 */
async function verifyChallengeHandler(request, reply) {
  const userId = request.user.id;

  const validation = validateBody(request.body, VERIFY_CONSUME_SCHEMA);
  if (!validation.valid) {
    throw createError(400, 'VALIDATION_ERROR', 'داده‌های ورودی نامعتبر است.', { errors: validation.errors });
  }

  const { challengeId, code } = request.body;

  // Verify ownership: challenge must belong to this user
  const challenge = await request.server.prisma.authChallenge.findUnique({
    where: { id: Number(challengeId) },
    select: { userId: true },
  });

  if (!challenge) {
    throw createError(404, 'CHALLENGE_NOT_FOUND', 'چالش یافت نشد.');
  }

  if (challenge.userId !== userId) {
    throw createError(403, 'FORBIDDEN', 'دسترسی به این چالش مجاز نیست.');
  }

  const result = await service.verifyChallenge({ challengeId, code });

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/challenges/consume
 * Consume a challenge (verify + mark consumed).
 * Body: { challengeId, code }
 */
async function consumeChallengeHandler(request, reply) {
  const userId = request.user.id;

  const validation = validateBody(request.body, VERIFY_CONSUME_SCHEMA);
  if (!validation.valid) {
    throw createError(400, 'VALIDATION_ERROR', 'داده‌های ورودی نامعتبر است.', { errors: validation.errors });
  }

  const { challengeId, code } = request.body;

  // Verify ownership
  const challenge = await request.server.prisma.authChallenge.findUnique({
    where: { id: Number(challengeId) },
    select: { userId: true },
  });

  if (!challenge) {
    throw createError(404, 'CHALLENGE_NOT_FOUND', 'چالش یافت نشد.');
  }

  if (challenge.userId !== userId) {
    throw createError(403, 'FORBIDDEN', 'دسترسی به این چالش مجاز نیست.');
  }

  const result = await service.consumeChallenge({ challengeId, code });

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * GET /auth/challenges/me
 * List current user's challenges for session management UI.
 */
async function listMyChallengesHandler(request, reply) {
  const userId = request.user.id;

  const challenges = await service.listUserChallenges(userId);

  return reply.send({
    success: true,
    data: { challenges },
  });
}

module.exports = {
  requestChallengeHandler,
  verifyChallengeHandler,
  consumeChallengeHandler,
  listMyChallengesHandler,
};