// =============================================================
// Handoff Service — Cross-app session transfer (PKCE code flow)
//
// Problem: the admin/company panels live on different origins from the
// website, and no token may ever travel in a URL.
//
// Flow:
//   1. Panel (step 1, /auth/start):
//        verifier = 32 random bytes (kept in the panel tab's sessionStorage)
//        challenge = base64url(SHA-256(verifier))
//        redirect → website /login?app&state&challenge
//   2. Website (/login):
//        mints a one-time code via POST /auth/handoff (authenticated),
//        bound to the challenge, valid 60s → redirect back to panel
//        /auth/callback#code&state
//   3. Panel (step 2, /auth/callback):
//        POST /auth/handoff/redeem { app, code, verifier } → session.
//
// Why it's safe:
//   - Code is single-use (deleted atomically on redeem).
//   - Code is useless without the verifier, which exists only in the
//     victim panel tab's sessionStorage (a link an attacker crafts
//     cannot know it).
//   - Binding the target app prevents a company code from opening the
//     admin panel. Access is re-checked at redeem time.
//   - Only a 60s, random code ever appears in a URL — never a token.
// =============================================================

const crypto = require('crypto');

const prisma = require('../../config/db');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');
const { jwtAccessExpiresIn } = require('../../config/env');
const {
  buildUserContext,
  issueTokens,
  expiryToSeconds,
} = require('./auth.service');

const HANDOFF_TTL_MS = 60 * 1000;

const APP_TO_ACCESS_TYPE = {
  admin: 'STAFF',
  company: 'COMPANY',
};

function createError(statusCode, code, message) {
  return { statusCode, code, message };
}

function sha256b64url(value) {
  return crypto.createHash('sha256').update(value).digest('base64url');
}

/**
 * Panel access rules: the target app must match the user's access type.
 * Wildcard permissions never override the app-context boundary.
 */
function assertPanelAccess(app, accessProfile) {
  const required = APP_TO_ACCESS_TYPE[app];
  if (!required) {
    throw createError(400, 'INVALID_APP', 'Unknown app.');
  }
  if (!accessProfile || accessProfile.type !== required) {
    throw createError(403, 'APP_ACCESS_DENIED', 'این حساب کاربری به این پنل دسترسی ندارد.');
  }
  if (accessProfile.isActive === false) {
    throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
  }
}

/**
 * Mint a one-time code bound to the PKCE challenge.
 * Called by the website (authenticated as the user being handed off).
 *
 * @param {number} userId
 * @param {string} app - 'admin' | 'company'
 * @param {string} challenge - base64url(SHA-256(verifier))
 * @returns {Promise<{code: string, expiresIn: number}>}
 */
async function createHandoffCode(userId, app, challenge) {
  const [user, accessProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    }),
    prisma.accessProfile.findUnique({
      where: { userId },
      select: { type: true, isActive: true, companyId: true },
    }),
  ]);

  if (!user || user.status !== 'ACTIVE') {
    throw createError(401, 'USER_DISABLED', 'حساب کاربری غیرفعال است.');
  }
  assertPanelAccess(app, accessProfile);

  const code = crypto.randomBytes(32).toString('base64url');

  const expiresAt = new Date(Date.now() + HANDOFF_TTL_MS);
  await prisma.$transaction(async (tx) => {
    // Housekeeping, code creation and its audit event commit together.
    await tx.handoffCode.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const created = await tx.handoffCode.create({
      data: {
        codeHash: sha256b64url(code),
        userId,
        app,
        challenge,
        expiresAt,
      },
      select: { id: true },
    });
    await recordAuditLogExplicit({
      tx,
      actorUserId: userId,
      actorAccessType: accessProfile.type,
      companyId: accessProfile.companyId || null,
      action: AUDIT_ACTIONS.AUTH_HANDOFF_CODE_CREATED,
      entityType: 'HandoffCode',
      entityId: created.id,
      metadata: { app, expiresIn: HANDOFF_TTL_MS / 1000 },
    });
  });

  return { code, expiresIn: HANDOFF_TTL_MS / 1000 };
}

/**
 * Exchange code + verifier for a session. Single-use: delete() is the
 * gate — of two concurrent callers only one gets the row.
 *
 * @param {object} fastify - for signing JWTs
 * @param {{app: string, code: string, verifier: string}} params
 */
async function redeemHandoffCode(fastify, { app, code, verifier }) {
  const INVALID = createError(
    400,
    'INVALID_HANDOFF',
    'کد انتقال نشست نامعتبر یا منقضی است.'
  );

  const redemption = await prisma.$transaction(async (tx) => {
    const codeHash = sha256b64url(code);
    const candidate = await tx.handoffCode.findUnique({ where: { codeHash } });
    if (!candidate) return { invalid: true };

    // Delete is the one-time gate. The state transition and audit outcome are
    // committed together, including wrong-app, expired and PKCE-failure cases.
    const deleted = await tx.handoffCode.deleteMany({ where: { id: candidate.id, codeHash } });
    if (deleted.count !== 1) return { invalid: true };

    let reason = null;
    if (candidate.expiresAt < new Date()) reason = 'EXPIRED';
    else if (candidate.app !== app) reason = 'APP_MISMATCH';
    else {
      const expected = Buffer.from(candidate.challenge, 'utf8');
      const actual = Buffer.from(sha256b64url(verifier), 'utf8');
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        reason = 'PKCE_MISMATCH';
      }
    }

    await recordAuditLogExplicit({
      tx,
      actorUserId: candidate.userId,
      actorAccessType: 'SYSTEM',
      companyId: null,
      action: reason ? AUDIT_ACTIONS.AUTH_HANDOFF_FAILED : AUDIT_ACTIONS.AUTH_HANDOFF_CODE_CONSUMED,
      entityType: 'HandoffCode',
      entityId: candidate.id,
      metadata: { app, ...(reason ? { reason } : {}) },
      ...(reason ? { outcome: 'FAILURE', severity: 'WARN' } : {}),
    });
    return reason ? { invalid: true } : { record: candidate };
  });

  if (redemption.invalid || !redemption.record) throw INVALID;
  const record = redemption.record;

  // Re-check access at redeem time — it could have been revoked while
  // the code was in flight (max 60s).
  const context = await buildUserContext(record.userId);
  if (!context.user || context.user.status !== 'ACTIVE') {
    throw createError(401, 'USER_DISABLED', 'حساب کاربری غیرفعال است.');
  }
  assertPanelAccess(app, context.accessProfile);

  // revokeExisting: false — the website tab keeps its own session; the
  // panel gets a second refresh token. Each rotates independently.
  const { accessToken, refreshToken } = await prisma.$transaction(async (tx) => {
    const tokens = await issueTokens(
      fastify,
      {
        userId: context.user.id,
        email: context.user.email,
        roles: context.roles,
        permissions: context.permissions,
        accessProfile: context.accessProfile,
      },
      { revokeExisting: false, tx }
    );
    await recordAuditLogExplicit({
      tx,
      actorUserId: context.user.id,
      actorAccessType: context.accessProfile?.type || 'STAFF',
      companyId: context.accessProfile?.companyId || null,
      action: AUDIT_ACTIONS.AUTH_HANDOFF_SESSION_ISSUED,
      entityType: 'User',
      entityId: context.user.id,
      metadata: { app },
    });
    return tokens;
  });

  return {
    ...context,
    accessToken,
    refreshToken,
    expiresIn: expiryToSeconds(jwtAccessExpiresIn),
  };
}

module.exports = {
  assertPanelAccess,
  createHandoffCode,
  redeemHandoffCode,
};
