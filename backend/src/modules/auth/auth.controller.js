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
//   sameSite:Lax    → CSRF protection
//   path:/api/v1/auth → cookie only sent to auth endpoints
// =============================================================

const authService = require('./auth.service');
const { nodeEnv } = require('../../config/env');
const { success } = require('../../utils/success');

const IS_PRODUCTION = nodeEnv === 'production';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60,
};


/**
 * POST /api/v1/auth/login
 *
 * Body:
 * {
 *   email,
 *   password
 * }
 *
 * email can be:
 * - email address
 */
async function login(request, reply) {

  const { email, password, app } = request.body || {};

  if (!email || !password) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'نام کاربری/ایمیل و رمز عبور الزامی است.',
        details: [
          ...(!email ? [{ field: 'email', message: 'Email is required.' }] : []),
          ...(!password ? [{ field: 'password', message: 'Password is required.' }] : []),
        ],
      },
    });
  }

  const loginValue = String(email).trim();

  if (!loginValue) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'نام کاربری یا ایمیل معتبر نیست.',
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


  return reply.code(200).send(success({
    tokens: { accessToken, refreshToken, expiresIn },
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


  return reply.code(200).send(success({
    tokens: { accessToken, refreshToken, expiresIn },
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
    newPassword
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


module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  me,
  adminChangeUserPassword,
  register,
  registerCompany,
};
