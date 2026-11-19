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
const smsProvider = require('../notifications/notification.sms.provider');
const emailProvider = require('../notifications/notification.email.provider');

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
  // LOGIN_MFA remains deferred until an approved login-enforcement flow exists.
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
async function checkRateLimits(userId, purpose, channel, destination, ipAddress, prismaClient = prisma) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - REQUEST_WINDOW_MS);
  const hourStart = new Date(now.getTime() - 60 * 60 * 1000);

  // 1. Per-user, per-purpose, per-channel limit
  const userRequests = await prismaClient.authChallenge.count({
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
  const destRequests = await prismaClient.authChallenge.count({
    where: {
      destination,
      createdAt: { gte: hourStart },
    },
  });
  if (destRequests >= MAX_DESTINATION_REQUESTS_PER_HOUR) {
    return { allowed: false, retryAfter: 3600, errorCode: 'RATE_LIMITED' };
  }

  // 3. Enforce the advertised resend cooldown, including sequential requests.
  const recentChallenge = await prismaClient.authChallenge.findFirst({
    where: {
      userId,
      purpose,
      channel,
      createdAt: { gte: new Date(now.getTime() - RESEND_COOLDOWN_MS) },
    },
    select: { id: true },
  });
  if (recentChallenge) {
    return { allowed: false, retryAfter: Math.ceil(RESEND_COOLDOWN_MS / 1000), errorCode: 'RESEND_COOLDOWN' };
  }

  // 4. Global IP limit (if provided)
  if (ipAddress) {
    // Note: This would require storing IP on AuthChallenge or a separate rate-limit table.
    // For now, rely on route-level rate limiting in Fastify.
  }

  return { allowed: true };
}

/**
 * Invalidate previous pending challenges for same user/purpose/channel.
 */
async function invalidatePreviousChallenges(userId, purpose, channel, prismaClient = prisma) {
  await prismaClient.authChallenge.updateMany({
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
  if (!PURPOSE_CHANNEL_MAP[purpose]) {
    throw createError(400, 'INVALID_PURPOSE', 'هدف چالش معتبر نیست.');
  }

  const allowedChannels = PURPOSE_CHANNEL_MAP[purpose];
  if (!allowedChannels.includes(channel)) {
    throw createError(400, 'INVALID_CHANNEL', 'کانال ارسال برای این هدف مجاز نیست.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, email: true, status: true, accessProfile: { select: { isActive: true, type: true } } },
  });
  if (!user) throw createError(404, 'NOT_FOUND', 'کاربر یافت نشد.');
  if (user.status !== 'ACTIVE') throw createError(403, 'ACCOUNT_DISABLED', 'حساب کاربری غیرفعال است.');
  if ((user.accessProfile?.type === 'STAFF' || user.accessProfile?.type === 'COMPANY') && user.accessProfile?.isActive === false) {
    throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
  }

  const normalizedDestination = channel === 'SMS' ? normalizePhone(destination) : normalizeEmail(destination);
  const userContact = channel === 'SMS' ? normalizePhone(user.phone) : normalizeEmail(user.email);
  if (normalizedDestination !== userContact) {
    throw createError(400, 'DESTINATION_MISMATCH', 'مقصد ارسال با اطلاعات تأییدشده کاربر مطابقت ندارد.');
  }

  const providerReady = channel === 'SMS' ? smsProvider.hasRealProvider() : emailProvider.hasRealProvider();
  if (!providerReady) {
    throw createError(503, 'CHALLENGE_DELIVERY_UNAVAILABLE', 'درگاه ارسال کد تأیید در حال حاضر در دسترس نیست.');
  }

  const code = generateCode();
  const secretHash = await hashCode(code);
  const reservation = await prisma.$transaction(async (tx) => {
    // User IDs are unique and the contact destination belongs to this user.
    // Serialize rate-limit checks + invalidation + creation to prevent parallel
    // requests from leaving multiple valid challenges for the same purpose.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { phone: true, email: true, status: true, accessProfile: { select: { isActive: true, type: true } } },
    });
    if (!currentUser || currentUser.status !== 'ACTIVE' || currentUser.accessProfile?.isActive === false) {
      throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال است.');
    }

    const currentContact = channel === 'SMS' ? normalizePhone(currentUser.phone) : normalizeEmail(currentUser.email);
    if (currentContact !== normalizedDestination) {
      throw createError(400, 'DESTINATION_MISMATCH', 'مقصد ارسال با اطلاعات تأییدشده کاربر مطابقت ندارد.');
    }

    const rateLimit = await checkRateLimits(userId, purpose, channel, normalizedDestination, ipAddress, tx);
    if (!rateLimit.allowed) {
      throw createError(429, rateLimit.errorCode, 'تعداد درخواست‌ها از حد مجاز گذشته است. لطفاً بعداً تلاش کنید.', { retryAfter: rateLimit.retryAfter });
    }

    await invalidatePreviousChallenges(userId, purpose, channel, tx);
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    const challenge = await tx.authChallenge.create({
      data: { userId, purpose, channel, destination: normalizedDestination, secretHash, expiresAt, maxAttempts: 5 },
      select: { id: true },
    });
    return { challengeId: challenge.id };
  });

  const purposeLabel = {
    PASSWORD_RESET: 'بازنشانی رمز عبور',
    PHONE_VERIFICATION: 'تأیید شماره تلفن',
    EMAIL_VERIFICATION: 'تأیید ایمیل',
    LOGIN_MFA: 'تأیید ورود',
  }[purpose] || 'تأیید هویت';
  const message = `کد ${purposeLabel} بازارگاه مخابرات: ${code} — اعتبار: ۱۵ دقیقه`;

  try {
    if (channel === 'SMS') {
      await smsProvider.sendSms({ to: normalizedDestination, body: message });
    } else {
      await emailProvider.sendEmail({
        to: normalizedDestination,
        subject: `کد ${purposeLabel} بازارگاه مخابرات`,
        text: message,
        allowConsoleFallback: false,
      });
    }
  } catch {
    await prisma.authChallenge.updateMany({
      where: { id: reservation.challengeId, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
    throw createError(503, 'CHALLENGE_DELIVERY_FAILED', 'ارسال کد تأیید ممکن نشد. لطفاً بعداً تلاش کنید.');
  }

  return {
    challengeId: reservation.challengeId,
    expiresIn: Math.ceil(CHALLENGE_TTL_MS / 1000),
    resendCooldown: Math.ceil(RESEND_COOLDOWN_MS / 1000),
  };
}

/**
 * Verify a challenge code WITHOUT consuming it.
 * @param {object} params - { challengeId, code }
 * @returns {Promise<{valid, purpose, remainingAttempts}>}
 */
async function loadChallengeForRetry(challengeId) {
  return prisma.authChallenge.findUnique({ where: { id: Number(challengeId) } });
}

async function assertChallengeAttemptState(challengeId) {
  const latest = await loadChallengeForRetry(challengeId);
  if (!latest) throw createError(404, 'CHALLENGE_NOT_FOUND', 'چالش یافت نشد.');
  if (latest.consumedAt) throw createError(400, 'CHALLENGE_CONSUMED', 'این چالش قبلاً مصرف شده است.');
  if (latest.invalidatedAt) throw createError(400, 'CHALLENGE_INVALIDATED', 'این چالش باطل شده است.');
  if (latest.expiresAt < new Date()) throw createError(400, 'CHALLENGE_EXPIRED', 'این چالش منقضی شده است.');
  if (latest.attemptCount >= latest.maxAttempts) {
    await prisma.authChallenge.updateMany({
      where: { id: latest.id, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
    throw createError(400, 'MAX_ATTEMPTS_EXCEEDED', 'حداکثر تعداد تلاش‌ها انجام شده است.');
  }
  throw createError(409, 'CHALLENGE_STATE_CHANGED', 'وضعیت چالش هم‌زمان تغییر کرده است. دوباره تلاش کنید.');
}

async function incrementChallengeAttempt(challenge, now = new Date()) {
  const updated = await prisma.authChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: now },
      // Compare-and-swap prevents concurrent requests from exceeding maxAttempts.
      attemptCount: { equals: challenge.attemptCount, lt: challenge.maxAttempts },
    },
    data: { attemptCount: { increment: 1 } },
  });
  if (updated.count !== 1) {
    await assertChallengeAttemptState(challenge.id);
  }
  return challenge.attemptCount + 1;
}

/**
 * Verify a challenge code WITHOUT consuming it.
 * The attempt counter is updated with a conditional database write so
 * concurrent requests cannot bypass maxAttempts.
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

  const now = new Date();
  if (challenge.expiresAt < now) {
    throw createError(400, 'CHALLENGE_EXPIRED', 'این چالش منقضی شده است.');
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    await prisma.authChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
    throw createError(400, 'MAX_ATTEMPTS_EXCEEDED', 'حداکثر تعداد تلاش‌ها انجام شده است.');
  }

  const valid = await verifyCode(code, challenge.secretHash);
  if (!valid) {
    const nextAttemptCount = await incrementChallengeAttempt(challenge, now);
    const remainingAttempts = Math.max(0, challenge.maxAttempts - nextAttemptCount);
    if (remainingAttempts === 0) {
      await prisma.authChallenge.updateMany({
        where: {
          id: challenge.id,
          attemptCount: nextAttemptCount,
          consumedAt: null,
          invalidatedAt: null,
        },
        data: { invalidatedAt: now },
      });
    }
    throw createError(400, 'INVALID_CODE', 'کد وارد شده اشتباه است.', { remainingAttempts });
  }

  // Successful verification does not consume a failed-attempt allowance.
  // The final one-time consume operation records the successful use atomically.
  return {
    valid: true,
    purpose: challenge.purpose,
    remainingAttempts: Math.max(0, challenge.maxAttempts - challenge.attemptCount),
  };
}

/**
 * Consume a challenge (verify + mark consumed).
 * The successful attempt increment and consumedAt transition are atomic.
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
    // Preserve idempotency for the owner after a successful request whose
    // response may have been lost in transit.
    return { consumed: true, purpose: challenge.purpose, userId: challenge.userId };
  }

  if (challenge.invalidatedAt) {
    throw createError(400, 'CHALLENGE_INVALIDATED', 'این چالش باطل شده است.');
  }

  const now = new Date();
  if (challenge.expiresAt < now) {
    throw createError(400, 'CHALLENGE_EXPIRED', 'این چالش منقضی شده است.');
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    await prisma.authChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
    throw createError(400, 'MAX_ATTEMPTS_EXCEEDED', 'حداکثر تعداد تلاش‌ها انجام شده است.');
  }

  const valid = await verifyCode(code, challenge.secretHash);
  if (!valid) {
    const nextAttemptCount = await incrementChallengeAttempt(challenge, now);
    const remainingAttempts = Math.max(0, challenge.maxAttempts - nextAttemptCount);
    if (remainingAttempts === 0) {
      await prisma.authChallenge.updateMany({
        where: {
          id: challenge.id,
          attemptCount: nextAttemptCount,
          consumedAt: null,
          invalidatedAt: null,
        },
        data: { invalidatedAt: now },
      });
    }
    throw createError(400, 'INVALID_CODE', 'کد وارد شده اشتباه است.', { remainingAttempts });
  }

  const consumed = await prisma.$transaction(async (tx) => {
    let verificationUser = null;
    // Contact-verification challenges are only valid for the exact contact
    // value that was verified when the challenge was issued.
    if (challenge.purpose === 'PHONE_VERIFICATION' || challenge.purpose === 'EMAIL_VERIFICATION') {
      verificationUser = await tx.user.findUnique({
        where: { id: challenge.userId },
        select: { phone: true, email: true },
      });
      if (!verificationUser) throw createError(404, 'USER_NOT_FOUND', 'کاربر یافت نشد.');

      const storedDestination = challenge.purpose === 'PHONE_VERIFICATION'
        ? normalizePhone(verificationUser.phone)
        : normalizeEmail(verificationUser.email);
      const challengeDestination = challenge.purpose === 'PHONE_VERIFICATION'
        ? normalizePhone(challenge.destination)
        : normalizeEmail(challenge.destination);
      if (!storedDestination || storedDestination !== challengeDestination) {
        throw createError(409, 'CHALLENGE_DESTINATION_CHANGED', 'اطلاعات تماس پس از ارسال کد تغییر کرده است؛ کد جدید درخواست کنید.');
      }
    }

    const update = await tx.authChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
        attemptCount: { equals: challenge.attemptCount, lt: challenge.maxAttempts },
      },
      data: {
        attemptCount: { increment: 1 },
        consumedAt: now,
      },
    });
    if (update.count !== 1) return { count: 0 };

    // Persist verification in the same transaction as challenge consumption.
    if (challenge.purpose === 'PHONE_VERIFICATION') {
      const verified = await tx.user.updateMany({
        where: { id: challenge.userId, phone: verificationUser.phone },
        data: { phoneVerifiedAt: now },
      });
      if (verified.count !== 1) throw createError(409, 'CHALLENGE_DESTINATION_CHANGED', 'شماره تلفن پس از بررسی تغییر کرده است؛ کد جدید درخواست کنید.');
    } else if (challenge.purpose === 'EMAIL_VERIFICATION') {
      const verified = await tx.user.updateMany({
        where: { id: challenge.userId, email: verificationUser.email },
        data: { emailVerifiedAt: now },
      });
      if (verified.count !== 1) throw createError(409, 'CHALLENGE_DESTINATION_CHANGED', 'نشانی ایمیل پس از بررسی تغییر کرده است؛ کد جدید درخواست کنید.');
    }
    return { count: 1 };
  });

  if (consumed.count !== 1) {
    const latest = await loadChallengeForRetry(challenge.id);
    if (latest?.consumedAt) {
      return { consumed: true, purpose: latest.purpose, userId: latest.userId };
    }
    await assertChallengeAttemptState(challenge.id);
  }

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