// =============================================================
// User Service — CRUD + role/permission assignment
//
// Domain model (post-refactor):
//   - User          = authentication identity only
//                     (id, email, phone, status, timestamps)
//   - Profile         = personal info for a human user
//                     (firstName, lastName, avatar, metadata)
//   - AccessProfile = authorization context
//                     (type: STAFF|COMPANY|CUSTOMER, companyId, isActive)
//   - UserRole      = roles assigned directly to the user
//
// Permission model (enforced at route level):
//   - users.read   → list + view
//   - users.create → create
//   - users.update → edit, activate/deactivate, change password, assign roles
//   - users.delete → delete
//
// Resource scoping:
//   - SUPER_ADMIN sees/edits all users
//   - Company admins see/edit only users in their own company
//     (scoped through accessProfile.companyId)
// =============================================================

const prisma = require('../../config/db');
const { hashPassword } = require('../../utils/password');
const { loadUserAccess, loadUserAccessDetailed, SUPER_ADMIN_ROLE } = require('../../utils/rbac');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');

// Public (safe) identity + related profile/access selection.
// Personal info lives in profile; company relation lives in
// accessProfile. The User row itself never carries personal fields.
const USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: { id: true, firstName: true, lastName: true, avatar: true, metadata: true },
  },
  accessProfile: {
    select: {
      id: true,
      type: true,
      companyId: true,
      isActive: true,
      company: { select: { id: true, name: true, type: true, status: true } },
    },
  },
};

// Columns that may be used for server-side sorting (whitelist to avoid
// arbitrary/unsafe orderBy input). Only real User columns are allowed.
const USER_SORT_FIELDS = ['id', 'email', 'status', 'createdAt', 'updatedAt'];

function buildUserOrderBy(query) {
  const sortBy = USER_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'id';
  const sortOrder = String(query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
  return { [sortBy]: sortOrder };
}

/**
 * The company a caller is scoped to (from their AccessProfile).
 * Falls back to the legacy token field for backward compatibility.
 */
function callerCompanyId(caller) {
  return caller.companyId ?? caller.accessProfile?.companyId ?? null;
}

function isGlobalStaffAdmin(caller) {
  // Roles never select the application context. Even a legacy/misassigned
  // SUPER_ADMIN role in COMPANY/CUSTOMER context must not bypass tenant boundaries.
  return caller?.accessType === 'STAFF' &&
    (caller?.roles?.includes(SUPER_ADMIN_ROLE) || caller?.permissions?.includes('*'));
}

function requireStaffOrCompany(caller) {
  if (!['STAFF', 'COMPANY'].includes(caller?.accessType)) {
    throw { statusCode: 403, code: 'ACCESS_TYPE_FORBIDDEN', message: 'User management is available only in STAFF or COMPANY context.' };
  }
}

function requireStaffContext(caller, operation) {
  if (caller?.accessType === 'COMPANY') {
    throw {
      statusCode: 403,
      code: 'COMPANY_USER_MANAGEMENT_RESTRICTED',
      message: `Company users may only view and enable or disable their own company's users; they cannot ${operation}.`,
    };
  }
  if (caller?.accessType !== 'STAFF') {
    throw { statusCode: 403, code: 'STAFF_CONTEXT_REQUIRED', message: 'This user-management action requires STAFF context.' };
  }
}

/**
 * List users with pagination, search and optional company scoping.
 */
async function listUsers(query, caller) {
  requireStaffOrCompany(caller);
  const { page, limit, skip, take } = getPaginationParams(query);
  const where = { AND: [] };

  if (caller.accessType === 'COMPANY') {
    where.AND.push({ accessProfile: { companyId: callerCompanyId(caller), type: 'COMPANY' } });
  } else if (!isGlobalStaffAdmin(caller)) {
    where.AND.push({ accessProfile: { companyId: callerCompanyId(caller) } });
  } else if (query.companyId) {
    where.AND.push({ accessProfile: { companyId: parseInt(query.companyId, 10) } });
  }

  if (query.type) {
    where.AND.push({ accessProfile: { type: query.type } });
  }

  if (query.search) {
    where.AND.push({
      OR: [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ],
    });
  }

  if (query.status) {
    where.AND.push({ status: query.status });
  } else if (query.isActive !== undefined && query.isActive !== '') {
    // Backward compatibility: map isActive to status
    where.AND.push({ status: String(query.isActive) === 'true' ? 'ACTIVE' : 'PENDING' });
  }

  if (where.AND.length === 0) delete where.AND;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: USER_SELECT, skip, take, orderBy: buildUserOrderBy(query) }),
  ]);

  const enriched = await Promise.all(
    users.map(async (u) => {
      const access = await loadUserAccess(u.id);
      return { ...u, roles: access.roles, permissions: access.permissions };
    })
  );

  return buildPaginatedResponse(enriched, total, page, limit);
}

/**
 * Get a single user with detailed roles & permissions.
 */
async function getUser(userId, caller) {
  requireStaffOrCompany(caller);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw { statusCode: 404, code: 'NOT_FOUND', message: 'کاربر یافت نشد.' };

  if (caller.accessType === 'COMPANY') {
    if (user.accessProfile?.type !== 'COMPANY' || user.accessProfile?.companyId !== callerCompanyId(caller)) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط به کاربران شرکت خود دسترسی دارید.' };
    }
  } else if (!isGlobalStaffAdmin(caller) && user.accessProfile?.companyId !== callerCompanyId(caller)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط به کاربران شرکت خود دسترسی دارید.' };
  }

  const access = await loadUserAccessDetailed(userId);
  return { ...user, roles: access.roles, permissions: access.permissions };
}

/**
 * Create a new user (STAFF or COMPANY employee) with:
 *   - User            (auth identity)
 *   - Profile         (personal info: firstName, lastName)
 *   - AccessProfile   (type + optional companyId + isActive)
 *   - UserRole[]      (assigned roles)
 *
 * Application membership is decided ONLY by accessProfile.type — never
 * by roles. Roles only control permissions within the selected app.
 */
async function createUser(data, caller) {
  requireStaffContext(caller, 'create users');

  // STAFF user-management permissions are the only path for creating accounts.
  // The requested access context and target company are resolved from the
  // validated request body only after the caller has passed the domain guard.
  let companyId = data.companyId ? parseInt(data.companyId, 10) : null;
  let accessType = data.type;
  if (!accessType) accessType = companyId ? 'COMPANY' : 'CUSTOMER';

  if (accessType === 'COMPANY' && !companyId) {
    throw { statusCode: 400, code: 'COMPANY_REQUIRED', message: 'برای کاربر شرکت، انتخاب شرکت الزامی است.' };
  }
  if (accessType !== 'COMPANY') companyId = accessType === 'STAFF' ? null : companyId;

  const rIds = (data.roleIds || []).map(Number);
  if (rIds.length) {
    const roles = await prisma.role.findMany({ where: { id: { in: rIds } }, select: { id: true, name: true, scope: true } });
    if (roles.length !== rIds.length) throw { statusCode: 400, code: 'INVALID_ROLE', message: 'نقش نامعتبر.' };
  }

  if (!data.phone) {
    throw { statusCode: 400, code: 'PHONE_REQUIRED', message: 'شماره تلفن الزامی است.' };
  }

  const normalizedPhone = String(data.phone).trim();
  const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existingPhone) throw { statusCode: 409, code: 'DUPLICATE_PHONE', message: 'شماره تلفن قبلاً ثبت شده است.' };

  const normalizedEmail = data.email ? data.email.toLowerCase().trim() : null;
  if (normalizedEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) throw { statusCode: 409, code: 'DUPLICATE_EMAIL', message: 'ایمیل قبلاً ثبت شده است.' };
  }

  const hashed = await hashPassword(data.password);
  const status = data.status || (data.isActive !== undefined ? (data.isActive ? 'ACTIVE' : 'PENDING') : 'ACTIVE');

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: hashed,
        status,
        roles: rIds.length ? { create: rIds.map((id) => ({ roleId: id })) } : undefined,
      },
      select: { id: true },
    });

    await tx.profile.create({
      data: {
        userId: user.id,
        firstName: data.firstName ? String(data.firstName).trim() : null,
        lastName: data.lastName ? String(data.lastName).trim() : null,
      },
    });

    await tx.accessProfile.create({
      data: {
        userId: user.id,
        type: accessType,
        companyId: accessType === 'COMPANY' ? companyId : null,
        isActive: true,
      },
    });

    return user;
  });

  return getUser(created.id, caller);
}

/**
 * Update a user (does NOT change password).
 * Personal fields go to Profile; company relation goes to
 * AccessProfile. The User row only owns email/phone/status.
 */
async function updateUser(userId, data, caller) {
  requireStaffContext(caller, 'edit user details');
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'کاربر یافت نشد.' };

  const isSuperAdmin = isGlobalStaffAdmin(caller);
  if (!isSuperAdmin && existing.accessProfile?.companyId !== callerCompanyId(caller)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط به کاربران شرکت خود دسترسی دارید.' };
  }

  // User identity fields
  const userData = {};
  if (data.email !== undefined) userData.email = data.email === null ? null : data.email.toLowerCase().trim();
  if (data.phone !== undefined) {
    if (data.phone === null || data.phone === '') {
      throw { statusCode: 400, code: 'PHONE_REQUIRED', message: 'شماره تلفن نمی‌تواند خالی باشد.' };
    }
    userData.phone = String(data.phone).trim();
  }
  if (data.status !== undefined) userData.status = data.status;
  else if (data.isActive !== undefined) userData.status = data.isActive ? 'ACTIVE' : 'PENDING';

  // Personal (profile) fields
  const profileData = {};
  if (data.firstName !== undefined) profileData.firstName = data.firstName === null ? null : String(data.firstName).trim();
  if (data.lastName !== undefined) profileData.lastName = data.lastName === null ? null : String(data.lastName).trim();
  if (data.avatar !== undefined) profileData.avatar = data.avatar;

  // Access (company) relation — SUPER_ADMIN only
  const accessData = {};
  if (isSuperAdmin && data.companyId !== undefined) {
    accessData.companyId = data.companyId ? parseInt(data.companyId, 10) : null;
  }
  if (isSuperAdmin && data.type !== undefined) accessData.type = data.type;
  if (data.isAccessActive !== undefined && !!data.isAccessActive !== !!existing.accessProfile?.isActive) {
    const requiredPermission = data.isAccessActive ? 'users.activate' : 'users.deactivate';
    if (!isSuperAdmin && !caller.permissions?.includes(requiredPermission) && !caller.permissions?.includes('*')) {
      throw {
        statusCode: 403,
        code: 'PERMISSION_REQUIRED',
        message: `Changing panel access requires the ${requiredPermission} permission.`,
      };
    }
    accessData.isActive = !!data.isAccessActive;
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) {
      await tx.user.update({ where: { id: userId }, data: userData });
    }
    if (Object.keys(profileData).length) {
      await tx.profile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
      });
    }
    if (Object.keys(accessData).length) {
      await tx.accessProfile.upsert({
        where: { userId },
        create: { userId, type: accessData.type || 'CUSTOMER', companyId: accessData.companyId ?? null, isActive: accessData.isActive ?? true },
        update: accessData,
      });
    }
  });

  return getUser(userId, caller);
}

/**
 * Set a user's role(s) and direct permissions.
 * Roles only control permissions inside the app; they NEVER decide which
 * application the user belongs to (that is accessProfile.type).
 */
async function setUserAccess(userId, roleId, permissionIds, caller) {
  requireStaffContext(caller, 'change roles or permissions');
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, accessProfile: { select: { companyId: true } } },
  });
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'کاربر یافت نشد.' };

  const isSuperAdmin = isGlobalStaffAdmin(caller);
  if (!isSuperAdmin && existing.accessProfile?.companyId !== callerCompanyId(caller)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط به کاربران شرکت خود دسترسی دارید.' };
  }

  const rId = roleId ? Number(roleId) : null;

  if (rId) {
    const role = await prisma.role.findUnique({ where: { id: rId }, select: { id: true, scope: true } });
    if (!role) throw { statusCode: 400, code: 'INVALID_ROLE', message: 'نقش نامعتبر.' };
    // A COMPANY-scoped caller (e.g. COMPANY_MANAGER) can only assign a
    // COMPANY-domain role — this closes the same privilege-escalation path
    // fixed in createUser() (was previously unchecked here entirely: any
    // existing role id, including SUPER_ADMIN's, would be accepted).
    if (caller.accessType === 'COMPANY' && role.scope !== 'COMPANY') {
      throw { statusCode: 403, code: 'ROLE_OUT_OF_SCOPE', message: 'شما فقط مجاز به تخصیص نقش‌های شرکتی هستید.' };
    }
  }

  // NOTE: Direct user-permissions were removed from the domain model — roles are
  // the single source of truth for permissions (see utils/rbac.js). There is no
  // `UserPermission` table, so `permissionIds` is accepted for backward
  // compatibility but intentionally not persisted.

  // If a role is being assigned to a PENDING user, activate them
  const statusUpdate = (rId && existing.status === 'PENDING')
    ? { status: 'ACTIVE' }
    : {};

  await prisma.$transaction([
    ...(Object.keys(statusUpdate).length ? [prisma.user.update({ where: { id: userId }, data: statusUpdate })] : []),
    prisma.userRole.deleteMany({ where: { userId } }),
    ...(rId ? [prisma.userRole.create({ data: { userId, roleId: rId } })] : []),
  ]);

  return loadUserAccessDetailed(userId);
}


/**
 * Delete a user. Cannot delete self or the last SUPER_ADMIN.
 */
async function deleteUser(userId, caller) {
  requireStaffContext(caller, 'delete users');
  if (userId === caller.id) {
    throw { statusCode: 400, code: 'CANNOT_DELETE_SELF', message: 'شما نمی‌توانید حساب خودتان را حذف کنید.' };
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accessProfile: { select: { companyId: true } },
      roles: { select: { role: { select: { name: true } } } },
    },
  });
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'کاربر یافت نشد.' };

  const isSuperAdmin = isGlobalStaffAdmin(caller);
  if (!isSuperAdmin && existing.accessProfile?.companyId !== callerCompanyId(caller)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط به کاربران شرکت خود دسترسی دارید.' };
  }

  const hasSA = existing.roles.some((ur) => ur.role.name === SUPER_ADMIN_ROLE);
  if (hasSA) {
    const saCount = await prisma.userRole.count({ where: { role: { name: SUPER_ADMIN_ROLE } } });
    if (saCount <= 1) throw { statusCode: 400, code: 'LAST_SUPER_ADMIN', message: 'آخرین مدیر کل سیستم قابل حذف نیست.' };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { message: 'کاربر با موفقیت حذف شد.' };
}

/**
 * Change a company user's access status (activate/deactivate panel access).
 * Toggles AccessProfile.isActive without touching the auth identity.
 */
async function setAccessActive(userId, isActive, caller) {
  requireStaffOrCompany(caller);
  if (Number(userId) === Number(caller.id)) {
    throw { statusCode: 403, code: 'CANNOT_SELF_MODIFY', message: 'شما نمی‌توانید دسترسی خودتان را فعال یا غیرفعال کنید.' };
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, accessProfile: { select: { id: true, type: true, companyId: true } } },
  });
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'کاربر یافت نشد.' };
  if (!existing.accessProfile) throw { statusCode: 400, code: 'NO_ACCESS_PROFILE', message: 'این کاربر پروفایل دسترسی ندارد.' };

  const isSuperAdmin = isGlobalStaffAdmin(caller);
  if (caller.accessType === 'COMPANY') {
    if (existing.accessProfile.type !== 'COMPANY' || existing.accessProfile.companyId !== callerCompanyId(caller)) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط می‌توانید دسترسی کاربران شرکت خود را تغییر دهید.' };
    }
  } else if (!isSuperAdmin && existing.accessProfile.companyId !== callerCompanyId(caller)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'شما فقط به کاربران شرکت خود دسترسی دارید.' };
  }

  await prisma.accessProfile.update({ where: { userId }, data: { isActive: !!isActive } });
  return getUser(userId, caller);
}

/**
 * Move a company user to a different company (SUPER_ADMIN only).
 */
async function moveUserToCompany(userId, companyId, caller) {
  requireStaffContext(caller, 'move users between companies');
  if (!isGlobalStaffAdmin(caller)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'تنها مدیر کل می‌تواند کاربر را بین شرکت‌ها جابجا کند.' };
  }

  const targetCompanyId = Number(companyId);
  const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
  if (!company) throw { statusCode: 404, code: 'COMPANY_NOT_FOUND', message: 'شرکت یافت نشد.' };

  await prisma.accessProfile.upsert({
    where: { userId },
    create: { userId, type: 'COMPANY', companyId: targetCompanyId, isActive: true },
    update: { type: 'COMPANY', companyId: targetCompanyId },
  });

  return getUser(userId, caller);
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  setUserAccess,
  deleteUser,
  setAccessActive,
  moveUserToCompany,
};