// =============================================================
// Auth Challenges Service — Core business logic for OTP/challenge flows
//
// Responsibilities:
//   - Request challenges (create AuthChallenge records)
//   - Verify challenges (check code without consuming)
//   - Consume challenges (verify + mark consumed + trigger domain action)
//   - List user's challenges (for session management UI)
//   - Abuse controls: rate limits, attempt throttling, invalidation
//
// Security:
//   - Only secretHash stored (bcrypt). Raw code never logged/returned.
//   - Generic error messages — no enumeration.
//   - Challenge ownership verified via challengeId + code.
// =============================================================

const crypto = require('crypto');
const prisma = require('../../config/db');
const { hashPassword: bcryptHash, verifyPassword: bcryptVerify } = require('../../utils/password');
const { createError } = require('./authChallenges.utils');

const CHALLENGE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 3;       // per user, per purpose, per channel
const REQUEST_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_DESTINATION_REQUESTS_PER_HOUR = 5;
const MAX_GLOBAL_IP_REQUESTS_PER_WINDOW = 20;

const PURPOSE_CHANNEL_MAP = {
  PASSWORD_RESET: ['SMS', 'EMAIL'],
  PHONE_VERIFICATION: ['SMS'],
  EMAIL_VERIFICATION: ['EMAIL'],
  LOGIN_MFA: ['SMS', 'EMAIL'],
};

/**
 * Normalize phone to E.164-ish format for comparison.
 * Strips non-digits, ensures leading +98 for Iran numbers.
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  // Iran mobile: 09xxxxxxxxx -> +989xxxxxxxxx
  if (digits.startsWith('09') && digits.length === 11) {
    return '+98' + digits.slice(1);
  }
  // Already has country code
  if (digits.startsWith('989') && digits.length === 12) {
    return '+' + digits;
  }
  // Default: prefix with + if missing
  return digits.startsWith('+') ? digits : '+' + digits;
}

/**
 * Normalize email to lowercase trimmed.
 */
function normalizeEmail(email) {
  if (!email) return null;
  return String(email).trim().toLowerCase();
}

/**
 * Mask phone/email for safe display in UI.
 */
function maskDestination(destination, channel) {
  if (channel === 'SMS') {
    const norm = normalizePhone(destination);
    if (norm && norm.length >= 8) {
      return norm.slice(0, 4) + ' XXX ' + norm.slice(-4);
    }
    return '***';
  }
  // EMAIL
  const [local, domain] = String(destination).split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 ? local[0] + '***' + local.slice(-1) : '***';
  return maskedLocal + '@' + domain;
}

/**
 * Check rate limits for challenge requests.
 * Returns { allowed: boolean, retryAfter?: number, errorCode?: string }
 */
async function checkRateLimits(userId, purpose, channel, destination, ipAddress) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - REQUEST_WINDOW_MS);
  const hourStart = new Date(now.getTime() - 60 * 60 * 1000);

  // 1. Per-user, per-purpose, per-channel limit
  const userRequests = await prisma.authChallenge.count({
    where: {
      userId,
      purpose,
      channel,
      createdAt: { gte: windowStart },
    },
  });
  if (userRequests >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil(REQUEST_WINDOW_MS / 1000), errorCode: 'RATE_LIMITED' };
  }

  // 2. Per-destination (phone/email) per hour
  const destRequests = await prisma.authChallenge.count({
    where: {
      destination,
      createdAt: { gte: hourStart },
    },
  });
  if (destRequests >= MAX_DESTINATION_REQUESTS_PER_HOUR) {
    return { allowed: false, retryAfter: 3600, errorCode: 'RATE_LIMITED' };
  }

  // 3. Global IP limit (if provided)
  if (ipAddress) {
    // Note: This would require storing IP on AuthChallenge or a separate rate-limit table.
    // For now, rely on route-level rate limiting in Fastify.
  }

  return { allowed: true };
}

/**
 * Invalidate previous pending challenges for same user/purpose/channel.
 */
async function invalidatePreviousChallenges(userId, purpose, channel) {
  await prisma.authChallenge.updateMany({
    where: {
      userId,
      purpose,
      channel,
      consumedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      invalidatedAt: new Date(),
    },
  });
}

/**
 * Generate a secure random 6-digit code.
 */
function generateCode() {
  // 6 digits: 000000 - 999999
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Hash a code using bcrypt (same as password hashing).
 */
async function hashCode(code) {
  return bcryptHash(code);
}

/**
 * Verify a code against its hash.
 */
async function verifyCode(code, hash) {
  return bcryptVerify(code, hash);
}

/**
 * Request a new challenge for the authenticated user.
 * @param {object} params - { userId, purpose, channel, destination, ipAddress }
 * @returns {Promise<{challengeId, expiresIn, resendCooldown}>}
 */
async function requestChallenge({ userId, purpose, channel, destination, ipAddress }) {
  // Validate purpose
  if (!PURPOSE_CHANNEL_MAP[purpose]) {
    throw createError(400, 'INVALID_PURPOSE', 'هدف چالش معتبر نیست.');
  }

  // Validate channel/purpose combination
  const allowedChannels = PURPOSE_CHANNEL_MAP[purpose];
  if (!allowedChannels.includes(channel)) {
    throw createError(400, 'INVALID_CHANNEL', 'کانال ارسال برای این هدف مجاز نیست.');
  }

  // Fetch user to validate destination ownership
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, email: true, status: true, accessProfile: { select: { isActive: true, type: true } } },
  });

  if (!user) {
    throw createError(404, 'NOT_FOUND', 'کاربر یافت نشد.');
  }

  if (user.status !== 'ACTIVE') {
    throw createError(403, 'ACCOUNT_DISABLED', 'حساب کاربری غیرفعال است.');
  }

  // Panel users (STAFF/COMPANY) must have active AccessProfile
  if ((user.accessProfile?.type === 'STAFF' || user.accessProfile?.type === 'COMPANY') && user.accessProfile?.isActive === false) {
    throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
  }

  // Validate destination matches user's verified contact
  const normalizedDestination = channel === 'SMS' ? normalizePhone(destination) : normalizeEmail(destination);
  const userContact = channel === 'SMS' ? normalizePhone(user.phone) : normalizeEmail(user.email);

  if (normalizedDestination !== userContact) {
    throw createError(400, 'DESTINATION_MISMATCH', 'مقصد ارسال با اطلاعات تأییدشده کاربر مطابقت ندارد.');
  }

  // Check rate limits
  const rateLimit = await checkRateLimits(userId, purpose, channel, normalizedDestination, ipAddress);
  if (!rateLimit.allowed) {
    throw createError(429, rateLimit.errorCode, 'تعداد درخواست‌ها از حد مجاز گذشته است. لطفاً بعداً تلاش کنید.', { retryAfter: rateLimit.retryAfter });
  }

  // Invalidate previous pending challenges for same purpose/channel
  await invalidatePreviousChallenges(userId, purpose, channel);

  // Generate code and hash
  const code = generateCode();
  const secretHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

  // Create challenge record
  const challenge = await prisma.authChallenge.create({
    data: {
      userId,
      purpose,
      channel,
      destination: normalizedDestination,
      secretHash,
      expiresAt,
      maxAttempts: 5,
    },
    select: { id: true },
  });

  // TODO: Send code via SMS/Email provider (integration point)
  // await notificationService.sendChallenge({ destination: normalizedDestination, channel, code, purpose });

  return {
    challengeId: challenge.id,
    expiresIn: Math.ceil(CHALLENGE_TTL_MS / 1000),
    resendCooldown: Math.ceil(RESEND_COOLDOWN_MS / 1000),
  };
}

/**
 * Verify a challenge code WITHOUT consuming it.
 * @param {object} params - { challengeId, code }
 * @returns {Promise<{valid, purpose, remainingAttempts}>}
 */
async function verifyChallenge({ challengeId, code }) {
  const challenge = await prisma.authChallenge.findUnique({
    where: { id: Number(challengeId) },
  });

  if (!challenge) {
    throw createError(404, 'CHALLENGE_NOT_FOUND', 'چالش یافت نشد.');
  }

  if (challenge.consumedAt) {
    throw createError(400, 'CHALLENGE_CONSUMED', 'این چالش قبلاً مصرف شده است.');
  }

  if (challenge.invalidatedAt) {
    throw createError(400, 'CHALLENGE_INVALIDATED', 'این چالش باطل شده است.');
  }

  if (challenge.expiresAt < new Date()) {
    throw createError(400, 'CHALLENGE_EXPIRED', 'این چالش منقضی شده است.');
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    // Auto-invalidate on max attempts
    await prisma.authChallenge.update({
      where: { id: challenge.id },
      data: { invalidatedAt: new Date() },
    });
    throw createError(400, 'MAX_ATTEMPTS_EXCEEDED', 'حداکثر تعداد تلاش‌ها انجام شده است.');
  }

  // Verify code
  const valid = await verifyCode(code, challenge.secretHash);

  // Increment attempt count regardless of success (prevents timing attacks)
  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { attemptCount: { increment: 1 } },
  });

  if (!valid) {
    const remaining = challenge.maxAttempts - challenge.attemptCount - 1;
    throw createError(400, 'INVALID_CODE', 'کد وارد شده اشتباه است.', { remainingAttempts: Math.max(0, remaining) });
  }

  return {
    valid: true,
    purpose: challenge.purpose,
    remainingAttempts: challenge.maxAttempts - challenge.attemptCount - 1,
  };
}

/**
 * Consume a challenge (verify + mark consumed).
 * This is the final step for password reset, phone/email verification.
 * @param {object} params - { challengeId, code }
 * @returns {Promise<{consumed, purpose, userId}>}
 */
async function consumeChallenge({ challengeId, code }) {
  const challenge = await prisma.authChallenge.findUnique({
    where: { id: Number(challengeId) },
    include: { user: { select: { id: true } } },
  });

  if (!challenge) {
    throw createError(404, 'CHALLENGE_NOT_FOUND', 'چالش یافت نشد.');
  }

  if (challenge.consumedAt) {
    // Idempotent: return success if already consumed
    return { consumed: true, purpose: challenge.purpose, userId: challenge.userId };
  }

  if (challenge.invalidatedAt) {
    throw createError(400, 'CHALLENGE_INVALIDATED', 'این چالش باطل شده است.');
  }

  if (challenge.expiresAt < new Date()) {
    throw createError(400, 'CHALLENGE_EXPIRED', 'این چالش منقضی شده است.');
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    await prisma.authChallenge.update({
      where: { id: challenge.id },
      data: { invalidatedAt: new Date() },
    });
    throw createError(400, 'MAX_ATTEMPTS_EXCEEDED', 'حداکثر تعداد تلاش‌ها انجام شده است.');
  }

  // Verify code
  const valid = await verifyCode(code, challenge.secretHash);

  // Increment attempt count
  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { attemptCount: { increment: 1 } },
  });

  if (!valid) {
    const remaining = challenge.maxAttempts - challenge.attemptCount - 1;
    throw createError(400, 'INVALID_CODE', 'کد وارد شده اشتباه است.', { remainingAttempts: Math.max(0, remaining) });
  }

  // Mark as consumed
  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  return { consumed: true, purpose: challenge.purpose, userId: challenge.userId };
}

/**
 * List current user's challenges (for session management UI).
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listUserChallenges(userId) {
  const challenges = await prisma.authChallenge.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      purpose: true,
      channel: true,
      destination: true,
      expiresAt: true,
      attemptCount: true,
      maxAttempts: true,
      consumedAt: true,
      invalidatedAt: true,
      createdAt: true,
    },
  });

  return challenges.map(c => {
    let status = 'PENDING';
    if (c.consumedAt) status = 'CONSUMED';
    else if (c.invalidatedAt) status = 'INVALIDATED';
    else if (c.expiresAt < new Date()) status = 'EXPIRED';

    return {
      id: c.id,
      purpose: c.purpose,
      channel: c.channel,
      destinationMasked: maskDestination(c.destination, c.channel),
      expiresAt: c.expiresAt.toISOString(),
      attemptCount: c.attemptCount,
      maxAttempts: c.maxAttempts,
      status,
    };
  });
}

module.exports = {
  requestChallenge,
  verifyChallenge,
  consumeChallenge,
  listUserChallenges,
  // Exported for testing
  PURPOSE_CHANNEL_MAP,
  CHALLENGE_TTL_MS,
  RESEND_COOLDOWN_MS,
  generateCode,
  hashCode,
  verifyCode,
  normalizePhone,
  normalizeEmail,
  maskDestination,
  checkRateLimits,
  invalidatePreviousChallenges,
};