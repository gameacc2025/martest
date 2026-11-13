// =============================================================
// Auth Controller — HTTP layer for auth routes
//
// Responsibilities:
//   - Read from request (body, cookies, user, params)
//   - Call service
//   - Set response (status, cookies, body)
//
// Cookie strategy for the refresh token:
//   httpOnly:true   → JS cannot read it (XSS protection)
//   secure:true     → only sent over HTTPS (set false in dev)
//   sameSite:Strict → CSRF protection; every app calls the API
//                     same-site (relative /api/v1 via the Vite/nginx proxy)
//   path:/api/v1/auth → cookie only sent to auth endpoints
//
// The refresh token NEVER appears in a response body — only the
// httpOnly cookie carries it. The access token is the only secret
// the JS layer ever sees, and it lives in memory only.
// =============================================================

const authService = require('./auth.service');
const handoffService = require('./handoff.service');
const { nodeEnv } = require('../../config/env');
const { success } = require('../../utils/success');

const IS_PRODUCTION = nodeEnv === 'production';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? 'strict' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60,
};


/**
 * POST /api/v1/auth/login
 *
 * Body:
 * {
 *   phone,
 *   password
 * }
 *
 * phone is the sole login identity.
 */
async function login(request, reply) {

  const { phone, password, app } = request.body || {};

  if (!phone || !password) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'شماره تلفن و رمز عبور الزامی است.',
        details: [
          ...(!phone ? [{ field: 'phone', message: 'Phone is required.' }] : []),
          ...(!password ? [{ field: 'password', message: 'Password is required.' }] : []),
        ],
      },
    });
  }

  const loginValue = String(phone).trim();

  if (!loginValue) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'شماره تلفن معتبر نیست.',
      },
    });
  }


  const {
    user,
    profile,
    accessProfile,
    roles,
    permissions,
    accessToken,
    refreshToken,
    expiresIn,
  } = await authService.login(
    request.server,
    loginValue,
    password,
    app
  );


  reply.setCookie(
    'refreshToken',
    refreshToken,
    REFRESH_COOKIE_OPTIONS
  );

  reply.header('Cache-Control', 'no-store');

  return reply.code(200).send(success({
    tokens: { accessToken, expiresIn },
    user,
    profile,
    accessProfile,
    roles,
    permissions,
  }));
}


/**
 * POST /api/v1/auth/refresh
 */
async function refresh(request, reply) {

  const {
    accessToken,
    refreshToken,
    expiresIn,
  } = await authService.refresh(
    request.server,
    request.refreshTokenRecord
  );


  reply.setCookie(
    'refreshToken',
    refreshToken,
    REFRESH_COOKIE_OPTIONS
  );

  reply.header('Cache-Control', 'no-store');

  return reply.code(200).send(success({
    tokens: { accessToken, expiresIn },
  }));
}


/**
 * POST /api/v1/auth/logout
 */
async function logout(request, reply) {

  await authService.logout(
    request.refreshTokenRecord.id
  );


  reply.clearCookie(
    'refreshToken',
    REFRESH_COOKIE_OPTIONS
  );


  return reply.code(200).send(success({
    message: 'با موفقیت خارج شدید.',
  }));
}


/**
 * POST /api/v1/auth/logout-all
 */
async function logoutAll(request, reply) {

  await authService.logoutAll(
    request.user.id
  );


  reply.clearCookie(
    'refreshToken',
    REFRESH_COOKIE_OPTIONS
  );


  return reply.code(200).send(success({
    message: 'از همه دستگاه‌ها خارج شدید.',
  }));
}


/**
 * GET /api/v1/auth/me
 */
async function me(request, reply) {

  // Returns { user, profile, accessProfile, roles, permissions }
  const context = await authService.getMe(
    request.user.id
  );

  return reply.send(success(context));
}


/**
 * PATCH /api/v1/auth/users/:id/password
 *
 * Admin resets another user's password.
 */
async function adminChangeUserPassword(request, reply) {

  const targetId = Number(request.params.id);

  const {
    newPassword,
  } = request.body || {};


  if (!targetId || !newPassword) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'شناسه کاربر و رمز جدید الزامی است.',
        details: [
          ...(!targetId ? [{ field: 'id', message: 'User ID is required.' }] : []),
          ...(!newPassword ? [{ field: 'newPassword', message: 'New password is required.' }] : []),
        ],
      },
    });
  }


  await authService.changeUserPassword(
    targetId,
    newPassword,
    request.user,
  );


  return reply.code(200).send(success({
    message: 'رمز عبور کاربر با موفقیت تغییر یافت.',
  }));
}


/**
 * POST /api/v1/auth/register
 * Public registration for customers.
 * Creates a PENDING user that requires admin approval.
 */
async function register(request, reply) {
  const {
    email, password, firstName, lastName, phone,
  } = request.body || {};

  const {
    user, profile, accessProfile, roles,
  } = await authService.register({
    email, password, firstName, lastName, phone,
  });

  return reply.code(201).send(success({
    message: 'ثبت نام با موفقیت انجام شد.',
    user,
    profile,
    accessProfile,
    roles,
  }));
}


/**
 * POST /api/v1/auth/register-company
 * Public registration for companies.
 * Creates a PENDING company + PENDING manager user.
 */
async function registerCompany(request, reply) {
  const { company, user, accessProfile } = await authService.registerCompany(request.body || {});

  return reply.code(201).send(success({
    message: 'ثبت نام شرکت با موفقیت انجام شد. شرکت و حساب مدیر پس از تأیید مدیر سیستم فعال خواهند شد.',
    company,
    user,
    accessProfile,
  }));
}


/**
 * POST /api/v1/auth/handoff
 *
 * Mint a one-time, PKCE-bound code the website uses to hand the
 * session off to the admin/company panel. Authenticated (access token).
 */
async function createHandoff(request, reply) {
  const { app, challenge } = request.body || {};

  const result = await handoffService.createHandoffCode(
    request.user.id,
    app,
    challenge
  );

  reply.header('Cache-Control', 'no-store');
  return reply.code(201).send(success(result));
}


/**
 * POST /api/v1/auth/handoff/redeem
 *
 * Exchange code + PKCE verifier for a fresh session in the panel.
 * Sets the refresh cookie; the body carries only the access token.
 */
async function redeemHandoff(request, reply) {
  const {
    accessToken,
    refreshToken,
    expiresIn,
    ...context
  } = await handoffService.redeemHandoffCode(
    request.server,
    request.body || {}
  );

  reply.setCookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  reply.header('Cache-Control', 'no-store');
  return reply.code(200).send(success({
    tokens: { accessToken, expiresIn },
    ...context,
  }));
}


/**
 * GET /api/v1/auth/sessions
 * List all active sessions for the current user.
 */
async function getSessions(request, reply) {
  const sessions = await authService.getSessions(request.user.id);

  // Mark the current session based on the refresh token in the request
  const currentTokenId = request.refreshTokenRecord?.id;
  if (currentTokenId) {
    sessions.forEach(s => {
      s.isCurrent = String(s.id) === String(currentTokenId);
    });
  }

  return reply.send(success({ sessions }));
}


/**
 * DELETE /api/v1/auth/sessions/:id
 * Revoke a specific session (refresh token) for the current user.
 */
async function revokeSession(request, reply) {
  const sessionId = Number(request.params.id);

  await authService.revokeSession(request.user.id, sessionId);

  // If revoking the current session, clear the cookie
  const currentTokenId = request.refreshTokenRecord?.id;
  if (currentTokenId && Number(currentTokenId) === sessionId) {
    reply.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  }

  return reply.code(200).send(success({
    message: 'نشست با موفقیت لغو شد.',
  }));
}


/**
 * POST /auth/forgot-password — public, enumeration-safe SMS OTP request.
 */
async function forgotPassword(request, reply) {
  await require('./password-recovery.service').requestPasswordReset({
    phone: request.body.phone,
    ipAddress: request.ip,
  });
  reply.header('Cache-Control', 'no-store');
  return reply.send(success({
    message: 'اگر حساب فعالی با این شماره وجود داشته باشد، کد بازنشانی ارسال می‌شود.',
  }));
}

/**
 * POST /auth/reset-password — consumes the OTP and revokes all existing sessions.
 */
async function resetPassword(request, reply) {
  await require('./password-recovery.service').resetPassword(request.body);
  reply.header('Cache-Control', 'no-store');
  return reply.send(success({ message: 'رمز عبور با موفقیت تغییر کرد. دوباره وارد شوید.' }));
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  logoutAll,
  me,
  adminChangeUserPassword,
  register,
  registerCompany,
  createHandoff,
  redeemHandoff,
  // Session management
  getSessions,
  revokeSession,
};
