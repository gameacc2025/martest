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
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

async function recordRolePermissionAudit(tx, actor, roleId, addedPermissionIds = [], removedPermissionIds = []) {
  for (const permissionId of addedPermissionIds) {
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.ROLE_PERMISSION_ADDED,
      entityType: 'RolePermission',
      entityId: `role:${roleId}:permission:${permissionId}`,
      after: { roleId, permissionId },
    });
  }
  for (const permissionId of removedPermissionIds) {
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.ROLE_PERMISSION_REMOVED,
      entityType: 'RolePermission',
      entityId: `role:${roleId}:permission:${permissionId}`,
      before: { roleId, permissionId },
    });
  }
}

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

async function createRole(data, actor = null) {
  const normalizedName = data.name.trim().toUpperCase().replace(/\s+/g, '_');
  const exists = await prisma.role.findUnique({ where: { name: normalizedName } });
  if (exists) throw { statusCode: 409, code: 'DUPLICATE_ROLE', message: 'این نام نقش قبلاً ثبت شده است.' };

  const permIds = (data.permissionIds || []).map(Number);
  if (permIds.length) {
    const count = await prisma.permission.count({ where: { id: { in: permIds } } });
    if (count !== permIds.length) throw { statusCode: 400, code: 'INVALID_PERMISSION', message: 'دسترسی نامعتبر.' };
  }

  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name: normalizedName,
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
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.ROLE_CREATED,
      entityType: 'Role',
      entityId: role.id,
      after: { name: role.name, scope: role.scope, permissionIds: permIds },
      metadata: { permissionCount: permIds.length },
    });
    await recordRolePermissionAudit(tx, actor, role.id, permIds, []);
    return role;
  });
}

async function updateRole(roleId, data, actor = null) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { select: { permissionId: true } } },
  });
  if (!role) throw { statusCode: 404, code: 'NOT_FOUND', message: 'نقش یافت نشد.' };

  const previousPermissionIds = (role.permissions || []).map((entry) => Number(entry.permissionId));
  const updateData = {};
  if (data.label !== undefined) updateData.label = data.label.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.scope !== undefined) {
    // System roles may have their label, description and permissions edited,
    // but their domain (STAFF / COMPANY / CUSTOMER) is immutable.
    if (role.isSystem && data.scope !== role.scope) {
      throw { statusCode: 400, code: 'SYSTEM_ROLE', message: 'دامنه‌ی نقش‌های سیستمی قابل تغییر نیست.' };
    }
    if (!role.isSystem) updateData.scope = data.scope;
  }

  const permIds = (data.permissionIds || []).map(Number);
  const nextPermissionIds = data.permissionIds === undefined ? previousPermissionIds : permIds;
  const addedPermissionIds = nextPermissionIds.filter((id) => !previousPermissionIds.includes(id));
  const removedPermissionIds = previousPermissionIds.filter((id) => !nextPermissionIds.includes(id));
  if (data.permissionIds !== undefined && permIds.length) {
    const count = await prisma.permission.count({ where: { id: { in: permIds } } });
    if (count !== permIds.length) throw { statusCode: 400, code: 'INVALID_PERMISSION', message: 'دسترسی نامعتبر.' };
  }

  return prisma.$transaction(async (tx) => {
    if (data.permissionIds !== undefined) {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permIds.length) {
        await tx.rolePermission.createMany({
          data: permIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await tx.role.update({ where: { id: roleId }, data: updateData, select: ROLE_SELECT });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.ROLE_UPDATED,
      entityType: 'Role',
      entityId: roleId,
      before: { label: role.label, description: role.description, scope: role.scope, permissionIds: previousPermissionIds },
      after: {
        label: updated.label,
        description: updated.description,
        scope: updated.scope,
        permissionIds: nextPermissionIds,
      },
      metadata: {
        changedFields: [...Object.keys(updateData), ...(data.permissionIds !== undefined ? ['permissionIds'] : [])],
        permissionCount: nextPermissionIds.length,
        addedPermissionIds,
        removedPermissionIds,
      },
    });
    await recordRolePermissionAudit(tx, actor, roleId, addedPermissionIds, removedPermissionIds);
    return updated;
  });
}

async function deleteRole(roleId, actor = null) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { select: { permissionId: true } } },
  });
  if (!role) throw { statusCode: 404, code: 'NOT_FOUND', message: 'نقش یافت نشد.' };

  if (role.isSystem) {
    throw { statusCode: 400, code: 'SYSTEM_ROLE', message: 'نقش‌های سیستمی قابل حذف نیستند.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.delete({ where: { id: roleId } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.ROLE_DELETED,
      entityType: 'Role',
      entityId: roleId,
      before: { name: role.name, scope: role.scope, permissionIds: (role.permissions || []).map((entry) => Number(entry.permissionId)) },
    });
    await recordRolePermissionAudit(
      tx,
      actor,
      roleId,
      [],
      (role.permissions || []).map((entry) => Number(entry.permissionId)),
    );
  });
  return { message: 'نقش با موفقیت حذف شد.' };
}

module.exports = { listRoles, listAssignableRoles, getRole, createRole, updateRole, deleteRole };