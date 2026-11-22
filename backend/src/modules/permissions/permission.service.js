// =============================================================
// Permission Service — CRUD for permissions
//
// Standalone permission management (extracted from roles module).
// Permissions can be assigned to roles via the roles module.
//
// - listPermissions()    → all permissions (with optional grouping)
// - getPermission()      → single permission by ID
// - createPermission()   → new permission
// - updatePermission()   → edit permission label/group
// - deletePermission()   → delete permission (if not assigned)
// =============================================================

const prisma = require('../../config/db');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { AppError } = require('../../utils/error');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const PERMISSION_SELECT = {
  id: true,
  name: true,
  label: true,
  description: true,
  group: true,
  createdAt: true,
};

/**
 * List permissions with optional pagination, search, and grouping.
 * @param {object} query - { page, limit, search, group, grouped }
 * @returns {Promise<object>} Paginated permissions or grouped object
 */
async function listPermissions(query = {}) {
  const { page, limit, skip, take } = getPaginationParams(query);

  const where = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { label: { contains: query.search, mode: 'insensitive' } },
      { group: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.group) {
    where.group = query.group;
  }

  // If no pagination requested, return all (grouped option for UI)
  if (!query.page && !query.limit) {
    const items = await prisma.permission.findMany({
      where,
      select: PERMISSION_SELECT,
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    });

    if (query.grouped === 'true' || query.grouped === true) {
      const grouped = {};
      for (const p of items) {
        const g = p.group || 'other';
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(p);
      }
      return { all: items, grouped };
    }

    return items;
  }

  const [total, items] = await Promise.all([
    prisma.permission.count({ where }),
    prisma.permission.findMany({
      where,
      skip,
      take,
      select: PERMISSION_SELECT,
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    }),
  ]);

  return buildPaginatedResponse(items, total, page, limit);
}

/**
 * Get a single permission by ID.
 */
async function getPermission(permissionId) {
  const permission = await prisma.permission.findUnique({
    where: { id: Number(permissionId) },
    select: PERMISSION_SELECT,
  });

  if (!permission) throw new AppError('دسترسی یافت نشد.', 404);
  return permission;
}

/**
 * Create a new permission.
 */
async function createPermission(data, actor = null) {
  const name = data.name.trim().toLowerCase().replace(/\s+/g, '.').replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '');
  const permIds = (data.permissionIds || []).map(Number);

  return prisma.$transaction(async (tx) => {
    const exists = await tx.permission.findUnique({ where: { name } });
    if (exists) throw new AppError('دسترسی با این نام قبلاً وجود دارد.', 409, true, 'DUPLICATE_PERMISSION');
    if (permIds.length) {
      const count = await tx.permission.count({ where: { id: { in: permIds } } });
      if (count !== permIds.length) throw new AppError('دسترسی نامعتبر.', 400, true, 'INVALID_PERMISSION');
    }

    const created = await tx.permission.create({
      data: {
        name,
        label: data.label.trim(),
        description: data.description || null,
        group: data.group || null,
        permissions: permIds.length
          ? { create: permIds.map((id) => ({ permissionId: id })) }
          : undefined,
      },
      select: PERMISSION_SELECT,
    });

    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.PERMISSION_CREATED,
      entityType: 'Permission',
      entityId: created.id,
      after: created,
    });
    return created;
  });
}

async function updatePermission(permissionId, data, actor = null) {
  const id = Number(permissionId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.permission.findUnique({ where: { id } });
    if (!existing) throw new AppError('دسترسی یافت نشد.', 404);

    const updateData = {};
    const before = { ...existing };
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.group !== undefined) updateData.group = data.group;

    if (data.name && data.name !== existing.name) {
      const normalizedName = data.name.trim().toLowerCase().replace(/\s+/g, '.');
      const nameExists = await tx.permission.findUnique({ where: { name: normalizedName } });
      if (nameExists) throw new AppError('نام دسترسی قبلاً استفاده شده است.', 409);
      updateData.name = normalizedName;
    }

    const updated = await tx.permission.update({
      where: { id },
      data: updateData,
      select: PERMISSION_SELECT,
    });

    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.PERMISSION_UPDATED,
      entityType: 'Permission',
      entityId: id,
      before,
      after: updated,
      metadata: { changedFields: Object.keys(updateData) },
    });
    return updated;
  });
}

async function deletePermission(permissionId, actor = null) {
  const id = Number(permissionId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.permission.findUnique({ where: { id } });
    if (!existing) throw new AppError('دسترسی یافت نشد.', 404);

    const rolesWithPermission = await tx.rolePermission.count({ where: { permissionId: id } });
    if (rolesWithPermission > 0) throw new AppError('این دسترسی به نقش‌ها اختصاص داده شده و قابل حذف نیست.', 400);

    const usersWithPermission = await tx.userPermission.count({ where: { permissionId: id } });
    if (usersWithPermission > 0) throw new AppError('این دسترسی به کاربران اختصاص داده شده و قابل حذف نیست.', 400);

    await tx.permission.delete({ where: { id } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.PERMISSION_DELETED,
      entityType: 'Permission',
      entityId: id,
      before: existing,
    });
    return { message: 'دسترسی با موفقیت حذف شد.' };
  });
}

module.exports = {
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
};