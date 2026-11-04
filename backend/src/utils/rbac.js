// مسیر فایل: backend/src/utils/rbac.js
// =============================================================
// RBAC core — role/permission resolution for an authenticated user.
//
// Consumed by:
//   - auth.service (embedded into the access token at login/refresh)
//   - user.service (returned to the admin UI's user list/detail)
//   - middlewares/rbac.js (SUPER_ADMIN_ROLE bypass check)
//   - companies/products/inquiries services (SUPER_ADMIN_ROLE checks)
// =============================================================

const prisma = require('../config/db');

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

/**
 * Load the flat {roles[], permissions[]} a user currently holds.
 * SUPER_ADMIN always collapses permissions down to the ['*'] wildcard,
 * regardless of what's explicitly attached to the role in the DB.
 * @param {number} userId
 * @returns {Promise<{roles: string[], permissions: string[]}>}
 */
async function loadUserAccess(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
              permissions: { select: { permission: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!user) return { roles: [], permissions: [] };

  const roles = user.roles.map((r) => r.role.name);

  if (roles.includes(SUPER_ADMIN_ROLE)) {
    return { roles, permissions: ['*'] };
  }

  const permissionSet = new Set();
  for (const r of user.roles) {
    for (const p of r.role.permissions) {
      permissionSet.add(p.permission.name);
    }
  }

  return { roles, permissions: [...permissionSet] };
}

/**
 * Load the same access, but as full role/permission records (id, label, etc.)
 * instead of bare name strings — used by the admin UI to render role/permission
 * pickers. SUPER_ADMIN gets every permission record in the table (no filter).
 * @param {number} userId
 * @returns {Promise<{roles: object[], permissions: object[]}>}
 */
async function loadUserAccessDetailed(userId) {
  const { roles: roleNames, permissions: permissionNames } = await loadUserAccess(userId);

  if (roleNames.length === 0) {
    return { roles: [], permissions: [] };
  }

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ where: { name: { in: roleNames } } }),
    permissionNames.includes('*')
      ? prisma.permission.findMany({})
      : prisma.permission.findMany({ where: { name: { in: permissionNames } } }),
  ]);

  return { roles, permissions };
}

module.exports = {
  SUPER_ADMIN_ROLE,
  loadUserAccess,
  loadUserAccessDetailed,
};