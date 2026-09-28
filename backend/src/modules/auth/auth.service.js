// =============================================================
// Auth Service — Core business logic for authentication
//
// Domain model (Phase-1 refactor):
//   - User            = authentication identity only
//                       (id, email, phone, passwordHash, status)
//   - AccessProfile   = application context (STAFF | COMPANY | CUSTOMER),
//                       optional companyId, exactly one per user
//   - Profile         = personal profile info (firstName, lastName,
//                       avatar, metadata) for EVERY human user.
//   - UserRole        = roles assigned directly to the user
//
// Registration flows:
//   1. Customer  → User + Profile + Role CUSTOMER_USER
//                  NO AccessProfile (CUSTOMER access is the default website).
//   2. Company   → User + Profile(firstName,lastName) + Company(PENDING)
//                  + AccessProfile(COMPANY, isActive=false)
//                  Panel access stays inactive and NO role is granted until an
//                  admin approves the company.
//   3. Staff     → created by admin only (users module); AccessProfile(STAFF)
//                  and roles are assigned by the admin.
//
// NOTE: "Profile" is the personal-profile table for EVERY human user
// (customers, company employees and staff), not just customers. Company users
// always have firstName/lastName stored here.
//
// Login response returns:
//   user, profile (if any), accessProfile, roles, permissions
// =============================================================

const prisma = require('../../config/db');

const {
  verifyPassword: comparePassword,
  hashPassword,
} = require('../../utils/password');

const {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} = require('../../utils/token');

const {
  loadUserAccess,
} = require('../../utils/rbac');

const {
  jwtAccessExpiresIn,
} = require('../../config/env');

/**
 * Convert an expiry string like '15m', '1h', '7d' to seconds.
 * @param {string} expiry - e.g. '15m'
 * @returns {number} seconds
 */
function expiryToSeconds(expiry) {
  const str = String(expiry);
  const unit = str.slice(-1);
  const value = parseInt(str.slice(0, -1), 10);
  if (unit === 'd') return value * 86400;
  if (unit === 'h') return value * 3600;
  if (unit === 'm') return value * 60;
  return value;
}

// Public (safe) User identity fields — never includes passwordHash.
const USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

// Profile fields returned to the client.
const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  metadata: true,
};

// AccessProfile fields returned to the client (+ minimal company).
const ACCESS_PROFILE_SELECT = {
  id: true,
  type: true,
  companyId: true,
  isActive: true,
  company: {
    select: { id: true, name: true, type: true, status: true },
  },
};

function createError(statusCode, code, message) {
  return { statusCode, code, message };
}

/**
 * Normalize an email/identifier to a lowercase, trimmed string.
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const value = email.trim().toLowerCase();
  return value || null;
}

/**
 * Find a user (with passwordHash) by phone — the sole login identity.
 * @param {string} phone
 */
async function findUserByPhone(phone) {
  const value = String(phone || '').trim();
  if (!value) return null;

  return prisma.user.findUnique({
    where: { phone: value },
    select: { ...USER_SELECT, passwordHash: true },
  });
}

/**
 * Assemble the full authenticated user context for responses.
 * @param {number} userId
 * @returns {Promise<{user, profile, accessProfile, roles, permissions}>}
 */
async function buildUserContext(userId) {
  const [user, profile, accessProfile, access] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT }),
    prisma.profile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    }),
    prisma.accessProfile.findUnique({
      where: { userId },
      select: ACCESS_PROFILE_SELECT,
    }),
    loadUserAccess(userId),
  ]);

  return {
    user,
    profile: profile || null,
    accessProfile: accessProfile || null,
    roles: access.roles,
    permissions: access.permissions,
  };
}

/**
 * Issue a fresh access + refresh token pair for a user and persist the
 * refresh token (hashed). Any previous refresh tokens are revoked.
 *
 * @param {object} fastify
 * @param {object} params - { userId, email, roles, permissions, accessProfile }
 */
async function issueTokens(fastify, { userId, email, roles, permissions, accessProfile }) {
  const accessToken = signAccessToken(fastify, {
    id: userId,
    email,
    roles,
    permissions,
    accessType: accessProfile?.type ?? null,
    companyId: accessProfile?.companyId ?? null,
  });

  const refreshToken = signRefreshToken(fastify, userId);

  // Revoke existing refresh tokens, then persist the new one.
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(refreshToken),
      userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Login with phone + password.
 * @param {object} fastify
 * @param {string} phone
 * @param {string} password
 * @param {string} [app] - 'admin' | 'company' — optional app-type guard
 */
async function login(fastify, phone, password, app) {
  const user = await findUserByPhone(phone);

  const INVALID_CREDENTIALS = createError(
    401,
    'INVALID_CREDENTIALS',
    'شماره تلفن یا رمز عبور اشتباه است.'
  );

  if (!user) {
    throw INVALID_CREDENTIALS;
  }

  if (user.status === 'PENDING') {
    throw createError(
      403,
      'ACCOUNT_PENDING',
      'حساب کاربری شما در انتظار تأیید است. لطفاً منتظر تأیید مدیر سیستم باشید.'
    );
  }

  if (user.status === 'REJECTED') {
    throw createError(
      403,
      'ACCOUNT_REJECTED',
      'حساب کاربری شما رد شده است. لطفاً با مدیر سیستم تماس بگیرید.'
    );
  }

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) {
    throw INVALID_CREDENTIALS;
  }

  const context = await buildUserContext(user.id);
  const { roles, permissions, accessProfile } = context;

  // ── AccessProfile.isActive enforcement ────────────────────
  // Panel users (STAFF, COMPANY) whose AccessProfile has been deactivated by
  // an admin must not be able to sign in — even though their auth identity
  // (User.status) is still ACTIVE. CUSTOMER access is not a "panel" and is
  // not gated here.
  const accessType = accessProfile?.type ?? null;
  if ((accessType === 'STAFF' || accessType === 'COMPANY') && accessProfile?.isActive === false) {
    throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.');
  }

  // ── App-type access validation (defense in depth) ─────────
  // Frontend guards are UX only; this is the real security boundary.
  // Access is decided by the AccessProfile.type, not by role names.
  if (app) {
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    if (!isSuperAdmin) {
      if (app === 'admin' && accessType !== 'STAFF') {
        throw createError(403, 'APP_ACCESS_DENIED', 'این حساب کاربری به پنل مدیریت دسترسی ندارد.');
      }
      if (app === 'company' && accessType !== 'COMPANY') {
        throw createError(403, 'APP_ACCESS_DENIED', 'این حساب کاربری به پنل شرکت دسترسی ندارد.');
      }
    }
  }

  const { accessToken, refreshToken } = await issueTokens(fastify, {
    userId: user.id,
    email: user.email,
    roles,
    permissions,
    accessProfile,
  });

  return {
    user: context.user,
    profile: context.profile,
    accessProfile: context.accessProfile,
    roles,
    permissions,
    accessToken,
    refreshToken,
    expiresIn: expiryToSeconds(jwtAccessExpiresIn),
  };
}

/**
 * Refresh token rotation.
 * @param {object} fastify
 * @param {object} tokenRecord - DB refresh-token record (includes user)
 */
async function refresh(fastify, tokenRecord) {
  if (!tokenRecord || !tokenRecord.user) {
    throw createError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token معتبر نیست.');
  }

  const dbUser = tokenRecord.user;

  if (!dbUser || dbUser.status !== 'ACTIVE') {
    throw createError(401, 'USER_DISABLED', 'حساب کاربری غیرفعال شده است.');
  }

  const deleted = await prisma.refreshToken.deleteMany({
    where: { id: tokenRecord.id },
  });

  if (deleted.count === 0) {
    throw createError(401, 'REFRESH_TOKEN_REUSED', 'Refresh token قبلاً استفاده شده است.');
  }

  const { roles, permissions } = await loadUserAccess(dbUser.id);
  const accessProfile = await prisma.accessProfile.findUnique({
    where: { userId: dbUser.id },
    select: ACCESS_PROFILE_SELECT,
  });

  // Reject token refresh for deactivated panel users (STAFF/COMPANY). This
  // ensures that disabling AccessProfile.isActive terminates panel access on
  // the next refresh, not just at the next fresh login.
  const refreshAccessType = accessProfile?.type ?? null;
  if ((refreshAccessType === 'STAFF' || refreshAccessType === 'COMPANY') && accessProfile?.isActive === false) {
    throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
  }

  const accessToken = signAccessToken(fastify, {
    id: dbUser.id,
    email: dbUser.email,
    roles,
    permissions,
    accessType: accessProfile?.type ?? null,
    companyId: accessProfile?.companyId ?? null,
  });

  const newRefreshToken = signRefreshToken(fastify, dbUser.id);

  await prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(newRefreshToken),
      userId: dbUser.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: expiryToSeconds(jwtAccessExpiresIn),
  };
}

/**
 * Logout current device (revoke a single refresh token).
 */
async function logout(tokenRecordId) {
  await prisma.refreshToken.deleteMany({ where: { id: tokenRecordId } });
}

/**
 * Logout all devices (revoke every refresh token for the user).
 */
async function logoutAll(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

/**
 * Current authenticated user context.
 * Returns user + profile + accessProfile + roles + permissions.
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw createError(404, 'NOT_FOUND', 'کاربر یافت نشد.');
  }

  return buildUserContext(userId);
}

/**
 * Change own password.
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createError(404, 'NOT_FOUND', 'کاربر یافت نشد.');
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw createError(400, 'WRONG_PASSWORD', 'رمز عبور فعلی اشتباه است.');
  }

  if (currentPassword === newPassword) {
    throw createError(400, 'SAME_PASSWORD', 'رمز جدید باید متفاوت باشد.');
  }

  if (!newPassword || newPassword.length < 8) {
    throw createError(400, 'WEAK_PASSWORD', 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
}

/**
 * Admin resets another user's password.
 */
async function changeUserPassword(targetUserId, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!user) {
    throw createError(404, 'NOT_FOUND', 'کاربر یافت نشد.');
  }

  if (!newPassword || newPassword.length < 8) {
    throw createError(400, 'WEAK_PASSWORD', 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetUserId }, data: { passwordHash } }),
    prisma.refreshToken.deleteMany({ where: { userId: targetUserId } }),
  ]);
}

/**
 * Register a new customer.
 *
 * Creates, in one transaction:
 *   - User (ACTIVE)
 *   - Profile (firstName, lastName)
 *   - UserRole → CUSTOMER_USER
 *
 * IMPORTANT: CUSTOMER users do NOT receive an AccessProfile. AccessProfile
 * exists only to gate STAFF/COMPANY panel access. A user with no AccessProfile
 * is treated as a plain website customer (see login()'s app guard, which only
 * restricts the 'admin'/'company' panels).
 *
 * @param {object} data - { phone, password, firstName, lastName, email }
 * @returns {Promise<object>} { user, profile, accessProfile, roles }
 */
async function register(data) {
  const { email, password, firstName, lastName, phone } = data;

  if (!phone || !password || !firstName || !lastName) {
    throw createError(400, 'VALIDATION_ERROR', 'شماره تلفن، رمز عبور، نام و نام خانوادگی الزامی است.');
  }

  if (password.length < 8) {
    throw createError(400, 'WEAK_PASSWORD', 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
  }

  const normalizedPhone = String(phone).trim();

  const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existingPhone) {
    throw createError(409, 'DUPLICATE_PHONE', 'شماره تلفن قبلاً ثبت شده است.');
  }

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      throw createError(409, 'DUPLICATE_EMAIL', 'ایمیل قبلاً ثبت شده است.');
    }
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        status: 'ACTIVE',
      },
      select: USER_SELECT,
    });

    const profile = await tx.profile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
      },
      select: PROFILE_SELECT,
    });

    // Assign the CUSTOMER_USER role.
    const customerRole = await tx.role.findUnique({ where: { name: 'CUSTOMER_USER' } });
    if (customerRole) {
      await tx.userRole.create({
        data: { userId: user.id, roleId: customerRole.id },
      });
    }

    // NOTE: No AccessProfile is created for CUSTOMER users (business rule 1).
    return { user, profile, accessProfile: null };
  });

  return {
    ...result,
    roles: ['CUSTOMER_USER'],
  };
}

/**
 * Register a new company with its manager account.
 *
 * Creates, in one transaction:
 *   - Company (PENDING) + default inquiry limits
 *   - User (PENDING) for the manager
 *   - Profile (manager's firstName / lastName — every human user has one)
 *   - AccessProfile { type: COMPANY, companyId, isActive: false }
 *
 * IMPORTANT (business rules 3 & 4):
 *   - Panel access is created INACTIVE (isActive=false). The manager cannot
 *     use the company panel until an admin approves the company.
 *   - NO role is assigned automatically. An admin assigns the company role(s)
 *     after approving the company.
 *
 * @param {object} data - Company + manager data
 * @returns {Promise<object>} { company, user, accessProfile }
 */
async function registerCompany(data) {
  const {
    // Company fields
    companyName, nameEn, nationalId, registrationNumber,
    companyEmail, phone, address, website, logo, type,
    // Manager (auth identity) fields
    managerEmail, managerPhone, password,
    // Manager personal fields (stored on Profile)
    managerFirstName, managerLastName,
  } = data;

  if (!companyName || !nationalId || !registrationNumber || !phone || !address) {
    throw createError(400, 'VALIDATION_ERROR', 'نام شرکت، شناسه ملی، شماره ثبت، تلفن و آدرس الزامی است.');
  }

  if (!managerPhone || !password || !managerFirstName || !managerLastName) {
    throw createError(400, 'VALIDATION_ERROR', 'شماره تلفن مدیر، رمز عبور، نام و نام خانوادگی مدیر الزامی است.');
  }

  if (password.length < 8) {
    throw createError(400, 'WEAK_PASSWORD', 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
  }

  const existingCompany = await prisma.company.findUnique({ where: { nationalId } });
  if (existingCompany) {
    throw createError(409, 'DUPLICATE_COMPANY', 'شرکتی با این شناسه ملی قبلاً ثبت شده است.');
  }

  const normalizedManagerPhone = String(managerPhone).trim();

  const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedManagerPhone } });
  if (existingPhone) {
    throw createError(409, 'DUPLICATE_PHONE', 'شماره تلفن مدیر قبلاً ثبت شده است.');
  }

  const normalizedManagerEmail = normalizeEmail(managerEmail);

  if (normalizedManagerEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedManagerEmail } });
    if (existingEmail) {
      throw createError(409, 'DUPLICATE_EMAIL', 'ایمیل مدیر قبلاً ثبت شده است.');
    }
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        nameEn: nameEn || null,
        nationalId,
        registrationNumber,
        type: type || null,
        email: companyEmail,
        phone,
        address,
        website: website || null,
        logo: logo || null,
        status: 'PENDING',
      },
    });

    await tx.companyInquiryLimit.create({
      data: {
        companyId: company.id,
        maxOpenInquiries: 5,
        maxActiveResponses: 20,
      },
    });

    const user = await tx.user.create({
      data: {
        email: normalizedManagerEmail,
        phone: normalizedManagerPhone,
        passwordHash,
        status: 'PENDING',
      },
      select: USER_SELECT,
    });

    // Company users are real people — store their name on the personal profile.
    const profile = await tx.profile.create({
      data: {
        userId: user.id,
        firstName: String(managerFirstName).trim(),
        lastName: String(managerLastName).trim(),
      },
      select: PROFILE_SELECT,
    });

    // Company context — panel access is INACTIVE until admin approval, and NO
    // role is assigned here (admin approves & assigns roles later).
    const accessProfile = await tx.accessProfile.create({
      data: {
        userId: user.id,
        type: 'COMPANY',
        companyId: company.id,
        isActive: false,
      },
      select: ACCESS_PROFILE_SELECT,
    });

    return { company, user, profile, accessProfile };
  });

  return result;
}

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  changePassword,
  changeUserPassword,
  register,
  registerCompany,
};
