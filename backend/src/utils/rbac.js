// =============================================================
// RBAC Helpers (server-side)
//
// Loads a user's effective roles + permissions from the DB.
// Effective permissions = union of all role permissions.
// (Direct user permissions were removed — roles are the single source
//  of truth in the new domain model.) SUPER_ADMIN role grants "*".
//
// Used by:
//   - auth.service  → to embed roles/permissions in the access token
//   - users.service → to return roles/permissions with the user object
// =============================================================

const prisma = require('../config/db');

// The system super-admin role name. A user holding this role bypasses
// all permission checks (handled in middlewares/rbac.js).
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

/**
 * Load a user's roles (names) and effective permissions (names).
 *
 * @param {number} userId
 * @returns {Promise<{ roles: string[], permissions: string[] }>}
 *   - roles:       e.g. ['SUPER_ADMIN'] or ['COMPANY_ADMIN']
 *   - permissions: e.g. ['users.create', 'users.read', ...]
 *                  SUPER_ADMIN gets ['*'] (matches everything)
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

  const roles = user.roles.map((ur) => ur.role.name);

  // SUPER_ADMIN bypasses everything
  if (roles.includes(SUPER_ADMIN_ROLE)) {
    return { roles, permissions: ['*'] };
  }

  // union of role permissions (roles are the only source of permissions)
  const rolePerms = user.roles.flatMap(
    (ur) => ur.role.permissions.map((rp) => rp.permission.name)
  );

  // de-duplicate
  const permissions = [...new Set(rolePerms)];

  return { roles, permissions };
}

/**
 * Full access object including the role + permission records (for UI).
 * Returns roles[] and permissions[] with id+name+label so the admin
 * panel can display and edit them.
 *
 * @param {number} userId
 */
async function loadUserAccessDetailed(userId) {
  const { roles, permissions } = await loadUserAccess(userId);

  const roleRecords = await prisma.role.findMany({
    where: { name: { in: roles } },
    select: { id: true, name: true, label: true, isSystem: true },
    orderBy: { name: 'asc' },
  });

  // For SUPER_ADMIN, show all permissions (wildcard) in detail listing
  let permRecords;
  if (permissions.includes('*')) {
    permRecords = await prisma.permission.findMany({
      select: { id: true, name: true, label: true, group: true },
      orderBy: { group: 'asc' },
    });
  } else {
    permRecords = await prisma.permission.findMany({
      where: { name: { in: permissions } },
      select: { id: true, name: true, label: true, group: true },
      orderBy: { group: 'asc' },
    });
  }

  return { roles: roleRecords, permissions: permRecords };
}

module.exports = {
  SUPER_ADMIN_ROLE,
  loadUserAccess,
  loadUserAccessDetailed,
};
