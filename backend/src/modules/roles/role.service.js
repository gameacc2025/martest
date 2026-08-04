// =============================================================
// Role Service — CRUD for roles
//
// Permissions are now managed via modules/permissions/permission.service.js.
//
// - listRoles()          → all roles with their permissions
// - getRole()            → single role with permissions
// - createRole()         → new role + assign permissions
// - updateRole()         → edit role label/desc + replace permissions
// - deleteRole()         → delete (system roles cannot be deleted)
// =============================================================

const prisma = require('../../config/db');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');

const ROLE_SELECT = {
  id: true, name: true, label: true, description: true, isSystem: true, scope: true,
  permissions: { select: { permission: { select: { id: true, name: true, label: true, group: true } } } },
  _count: { select: { users: true } },
  createdAt: true, updatedAt: true,
};

/**
 * List roles with optional pagination and search.
 * @param {object} query - { page, limit, search }
 * @returns {Promise<object|Array>} Paginated roles or plain array if no pagination requested
 */
async function listRoles(query = {}) {
  const { page, limit, skip, take } = getPaginationParams(query);

  const where = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { label: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // If no pagination requested, return all roles as a plain array
  if (!query.page && !query.limit) {
    return prisma.role.findMany({ where, select: ROLE_SELECT, orderBy: { name: 'asc' } });
  }

  const [total, roles] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({ where, select: ROLE_SELECT, skip, take, orderBy: { name: 'asc' } }),
  ]);

  return buildPaginatedResponse(roles, total, page, limit);
}

/**
 * List roles assignable by the caller when creating/editing a user in their
 * own domain. Intentionally NOT gated by `roles.read` (role management) — a
 * COMPANY_MANAGER needs to pick a role for a new company user without being
 * able to browse/manage the full role catalogue. Filtering is done purely
 * via the role's `scope` column (set explicitly when the role is
 * created) — NOT by role name — so any newly created role in the caller's
 * own domain shows up automatically with no code change.
 */
async function listAssignableRoles(caller) {
  return prisma.role.findMany({
    where: { scope: caller.accessType },
    select: { id: true, name: true, label: true, scope: true },
    orderBy: { name: 'asc' },
  });
}

async function getRole(roleId) {
  const role = await prisma.role.findUnique({
    where: { id: roleId }, select: ROLE_SELECT,
  });
  if (!role) throw { statusCode: 404, code: 'NOT_FOUND', message: 'نقش یافت نشد.' };
  return role;
}

async function createRole(data) {
  const exists = await prisma.role.findUnique({ where: { name: data.name } });
  if (exists) throw { statusCode: 409, code: 'DUPLICATE_ROLE', message: 'این نام نقش قبلاً ثبت شده است.' };

  const permIds = (data.permissionIds || []).map(Number);
  if (permIds.length) {
    const count = await prisma.permission.count({ where: { id: { in: permIds } } });
    if (count !== permIds.length) throw { statusCode: 400, code: 'INVALID_PERMISSION', message: 'دسترسی نامعتبر.' };
  }

  return prisma.role.create({
    data: {
      name: data.name.trim().toUpperCase().replace(/\s+/g, '_'),
      label: data.label.trim(),
      description: data.description || null,
      scope: data.scope,
      isSystem: false,
      permissions: permIds.length
        ? { create: permIds.map((id) => ({ permissionId: id })) }
        : undefined,
    },
    select: ROLE_SELECT,
  });
}

async function updateRole(roleId, data) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw { statusCode: 404, code: 'NOT_FOUND', message: 'نقش یافت نشد.' };

  const updateData = {};
  if (data.label !== undefined) updateData.label = data.label.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.scope !== undefined) {
    if (role.isSystem) {
      throw { statusCode: 400, code: 'SYSTEM_ROLE', message: 'دامنه‌ی نقش‌های سیستمی قابل تغییر نیست.' };
    }
    updateData.scope = data.scope;
  }

  const permIds = (data.permissionIds || []).map(Number);
  if (data.permissionIds !== undefined) {
    if (permIds.length) {
      const count = await prisma.permission.count({ where: { id: { in: permIds } } });
      if (count !== permIds.length) throw { statusCode: 400, code: 'INVALID_PERMISSION', message: 'دسترسی نامعتبر.' };
    }
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(permIds.length ? [prisma.rolePermission.createMany({
        data: permIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      })] : []),
    ]);
  }

  return prisma.role.update({ where: { id: roleId }, data: updateData, select: ROLE_SELECT });
}

async function deleteRole(roleId) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw { statusCode: 404, code: 'NOT_FOUND', message: 'نقش یافت نشد.' };

  if (role.isSystem) {
    throw { statusCode: 400, code: 'SYSTEM_ROLE', message: 'نقش‌های سیستمی قابل حذف نیستند.' };
  }

  await prisma.role.delete({ where: { id: roleId } });
  return { message: 'نقش با موفقیت حذف شد.' };
}

module.exports = { listRoles, listAssignableRoles, getRole, createRole, updateRole, deleteRole };