const crypto = require('node:crypto');
const prisma = require('../../config/db');
const { hashPassword, verifyPassword } = require('../../utils/password');
const smsProvider = require('../notifications/notification.sms.provider');
const { createError } = require('../auth-challenges/authChallenges.utils');

const PURPOSE = 'PASSWORD_RESET';
const CHANNEL = 'SMS';
const CHALLENGE_TTL_MS = 15 * 60 * 1000;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const DESTINATION_WINDOW_MS = 60 * 60 * 1000;
const MAX_USER_REQUESTS = 3;
const MAX_DESTINATION_REQUESTS = 5;
const MAX_ATTEMPTS = 5;

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('09') && digits.length === 11) return '+98' + digits.slice(1);
  if (digits.startsWith('989') && digits.length === 12) return '+' + digits;
  return digits ? '+' + digits : null;
}

function invalidCode() {
  return createError(400, 'INVALID_RESET_CODE', 'کد بازنشانی معتبر نیست یا منقضی شده است.');
}

async function requestPasswordReset({ phone, ipAddress }) {
  const rawPhone = String(phone || '').trim();
  if (rawPhone.length < 7 || rawPhone.length > 20) {
    throw createError(400, 'INVALID_PHONE', 'شماره تلفن معتبر نیست.');
  }

  // Fail closed for every caller when the SMS channel is not configured.
  // This check happens before account lookup, so it cannot reveal whether an account exists.
  if (!smsProvider.hasRealProvider()) {
    throw createError(503, 'PASSWORD_RECOVERY_UNAVAILABLE', 'بازیابی رمز عبور در حال حاضر در دسترس نیست.');
  }

  const user = await prisma.user.findUnique({
    where: { phone: rawPhone },
    select: { id: true, phone: true, status: true, accessProfile: { select: { type: true, isActive: true } } },
  });

  // Same response for unknown, disabled and eligible accounts.
  if (!user || user.status !== 'ACTIVE' || user.accessProfile?.isActive === false) {
    return { accepted: true };
  }

  const destination = normalizePhone(user.phone);
  const now = new Date();
  const windowStart = new Date(now.getTime() - REQUEST_WINDOW_MS);
  const destinationStart = new Date(now.getTime() - DESTINATION_WINDOW_MS);
  const [userRequests, destinationRequests, recentChallenge] = await Promise.all([
    prisma.authChallenge.count({ where: { userId: user.id, purpose: PURPOSE, channel: CHANNEL, createdAt: { gte: windowStart } } }),
    prisma.authChallenge.count({ where: { destination, purpose: PURPOSE, channel: CHANNEL, createdAt: { gte: destinationStart } } }),
    prisma.authChallenge.findFirst({
      where: { userId: user.id, purpose: PURPOSE, channel: CHANNEL, createdAt: { gte: new Date(now.getTime() - 60_000) } },
      select: { id: true },
    }),
  ]);

  if (userRequests >= MAX_USER_REQUESTS || destinationRequests >= MAX_DESTINATION_REQUESTS || recentChallenge) {
    return { accepted: true };
  }

  await prisma.authChallenge.updateMany({
    where: { userId: user.id, purpose: PURPOSE, channel: CHANNEL, consumedAt: null, invalidatedAt: null, expiresAt: { gt: now } },
    data: { invalidatedAt: now },
  });

  const code = String(crypto.randomInt(100000, 1000000));
  const secretHash = await hashPassword(code);
  const challenge = await prisma.authChallenge.create({
    data: {
      userId: user.id,
      purpose: PURPOSE,
      channel: CHANNEL,
      destination,
      secretHash,
      expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
      maxAttempts: MAX_ATTEMPTS,
    },
    select: { id: true },
  });

  try {
    await smsProvider.sendSms({
      to: destination,
      body: `کد بازنشانی رمز عبور بازارگاه مخابرات: ${code} — اعتبار: ۱۵ دقیقه`,
    });
  } catch {
    await prisma.authChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { invalidatedAt: new Date() },
    });
    throw createError(503, 'PASSWORD_RECOVERY_UNAVAILABLE', 'ارسال کد بازنشانی ممکن نشد. لطفاً بعداً تلاش کنید.');
  }

  return { accepted: true };
}

async function resetPassword({ phone, code, newPassword }) {
  const rawPhone = String(phone || '').trim();
  const otp = String(code || '').trim();
  if (rawPhone.length < 7 || rawPhone.length > 20 || !/^\d{6}$/.test(otp)) {
    throw invalidCode();
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    throw createError(400, 'WEAK_PASSWORD', 'رمز عبور باید حداقل ۸ و حداکثر ۱۲۸ نویسه باشد.');
  }

  const user = await prisma.user.findUnique({
    where: { phone: rawPhone },
    select: { id: true, status: true, accessProfile: { select: { isActive: true } } },
  });
  if (!user || user.status !== 'ACTIVE' || user.accessProfile?.isActive === false) throw invalidCode();

  const now = new Date();
  const challenge = await prisma.authChallenge.findFirst({
    where: {
      userId: user.id,
      purpose: PURPOSE,
      channel: CHANNEL,
      consumedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!challenge || challenge.attemptCount >= challenge.maxAttempts) throw invalidCode();

  const valid = await verifyPassword(otp, challenge.secretHash);
  if (!valid) {
    const nextAttemptCount = challenge.attemptCount + 1;
    await prisma.authChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, invalidatedAt: null, attemptCount: challenge.attemptCount },
      data: {
        attemptCount: { increment: 1 },
        ...(nextAttemptCount >= challenge.maxAttempts ? { invalidatedAt: now } : {}),
      },
    });
    throw invalidCode();
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.authChallenge.updateMany({
      where: {
        id: challenge.id,
        userId: user.id,
        purpose: PURPOSE,
        channel: CHANNEL,
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: new Date() },
        attemptCount: challenge.attemptCount,
      },
      data: { consumedAt: new Date(), attemptCount: { increment: 1 } },
    });
    if (claimed.count !== 1) throw invalidCode();

    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
  });

  return { success: true };
}

module.exports = { requestPasswordReset, resetPassword, normalizePhone };
