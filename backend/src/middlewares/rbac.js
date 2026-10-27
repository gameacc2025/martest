// =============================================================
// RBAC Middleware — Role & Permission Based Access Control
//
// Two layers of authorization:
//
//   1. Access-type guard (domain boundary)
//      requireAccessType(...types)
//        - Checks request.user.accessType (from JWT / AccessProfile)
//        - AccessProfile.type is always enforced, including for SUPER_ADMIN
//        - App rules:
//            admin panel  → STAFF only
//            company panel → COMPANY only
//            website      → CUSTOMER (or public — no guard needed)
//
//   2. Permission guard (fine-grained action control)
//      requirePermission(...perms)   — user must have ALL
//      requireAnyPermission(...perms) — user must have at least ONE
//        - SUPER_ADMIN (permissions: ['*']) bypasses everything
//
// Usage in routes:
//
//   // Admin panel route — STAFF only + permission
//   fastify.post('/users', {
//     onRequest: [fastify.authenticate],
//     preHandler: [requireAccessType('STAFF'), requirePermission('users.create')],
//   }, handler);
//
//   // Company panel route — COMPANY only
//   fastify.get('/products', {
//     onRequest: [fastify.authenticate],
//     preHandler: [requireAccessType('COMPANY'), requirePermission('products.read')],
//   }, handler);
//
//   // Website route — CUSTOMER (authenticated)
//   fastify.post('/inquiries', {
//     onRequest: [fastify.authenticate],
//     preHandler: [requireAccessType('CUSTOMER'), requirePermission('inquiries.create')],
//   }, handler);
//
// Note:
//   - All checks MUST run AFTER authenticate (needs request.user set)
//   - Resource-level checks (e.g. "edit only your own products") are done
//     inside the corresponding service function
// =============================================================

const { SUPER_ADMIN_ROLE } = require('../utils/rbac');

function unauthorized(reply, message = 'Authentication required.') {
  return reply.code(401).send({
    error: true,
    code: 'UNAUTHORIZED',
    message,
  });
}

function forbidden(reply, message = 'Access denied.') {
  return reply.code(403).send({
    error: true,
    code: 'FORBIDDEN',
    message,
  });
}

/**
 * Returns true if the user's permissions satisfy the requirement.
 * SUPER_ADMIN (permissions: ['*']) matches everything.
 *
 * @param {object} user - request.user (has permissions[])
 * @param {string[]} required - permission names to check
 * @param {'all'|'any'} mode
 */
function hasPermission(user, required, mode = 'all') {
  if (!user || !Array.isArray(user.permissions)) return false;
  if (user.permissions.includes('*')) return true; // SUPER_ADMIN
  if (mode === 'any') return required.some((p) => user.permissions.includes(p));
  return required.every((p) => user.permissions.includes(p));
}

/**
 * Fastify preHandler factory — require the user's AccessProfile.type to be
 * one of the allowed types.
 *
 * Role membership never overrides the authenticated AccessProfile.type.
 *
 * App rules:
 *   Admin panel  → requireAccessType('STAFF')
 *   Company panel → requireAccessType('COMPANY')
 *   Website      → requireAccessType('CUSTOMER')  (or no guard for public)
 *
 * @param {...string} allowedTypes - 'STAFF' | 'COMPANY' | 'CUSTOMER'
 */
function requireAccessType(...allowedTypes) {
  return async function checkAccessType(request, reply) {
    const user = request.user;
    if (!user) return unauthorized(reply);

    const accessType = user.accessType ?? null;
    if (!allowedTypes.includes(accessType)) {
      return forbidden(
        reply,
        `Access denied. This endpoint requires access type: ${allowedTypes.join(' or ')}.`
      );
    }
  };
}

/**
 * Strict access-context guard for domain boundaries that must not be
 * bypassed by SUPER_ADMIN role membership. Use for staff-only management
 * surfaces (roles/permissions) and other routes where AccessProfile.type
 * is the security boundary, not just a frontend routing hint.
 */
function requireExactAccessType(...allowedTypes) {
  return async function checkExactAccessType(request, reply) {
    const user = request.user;
    if (!user) return unauthorized(reply);
    const accessType = user.accessType ?? null;
    if (!allowedTypes.includes(accessType)) {
      return forbidden(
        reply,
        `Access denied. This endpoint requires access type: ${allowedTypes.join(' or ')}.`
      );
    }
  };
}

/**
 * Fastify preHandler factory — require ALL the given permissions.
 * @param {...string} permissions
 */
function requirePermission(...permissions) {
  return async function checkPermission(request, reply) {
    const user = request.user;
    if (!user) return unauthorized(reply);
    if (!hasPermission(user, permissions, 'all')) {
      return forbidden(reply, `Access denied. Required permission: ${permissions.join(', ')}.`);
    }
  };
}

/**
 * Fastify preHandler factory — require ANY of the given permissions.
 * @param {...string} permissions
 */
function requireAnyPermission(...permissions) {
  return async function checkAnyPermission(request, reply) {
    const user = request.user;
    if (!user) return unauthorized(reply);
    if (!hasPermission(user, permissions, 'any')) {
      return forbidden(reply, `Access denied. Required one of: ${permissions.join(', ')}.`);
    }
  };
}

/**
 * Fastify preHandler factory — allow only the specified roles.
 * (Kept for backward compatibility; prefer permission-based checks.)
 * @param {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return async function checkRole(request, reply) {
    const user = request.user;
    if (!user || !Array.isArray(user.roles)) return unauthorized(reply);

    // SUPER_ADMIN bypasses role checks too
    if (user.roles.includes(SUPER_ADMIN_ROLE)) return;

    const hasRole = allowedRoles.some((r) => user.roles.includes(r));
    if (!hasRole) {
      return forbidden(reply, `Access denied. Required role: ${allowedRoles.join(' or ')}.`);
    }
  };
}

/**
 * Ensures a COMPANY_ADMIN operates only on their own company's resources.
 * SUPER_ADMIN passes through without restriction.
 *
 * Usage: pass a function that extracts the target companyId from the request.
 *   preHandler: [requireOwnCompany((req) => parseInt(req.params.companyId))]
 *
 * @param {Function} getTargetCompanyId - (request) => number
 */
function requireOwnCompany(getTargetCompanyId) {
  return async function checkCompany(request, reply) {
    const user = request.user;
    if (!user) return unauthorized(reply);

    if (user.roles.includes(SUPER_ADMIN_ROLE)) return;

    const targetCompanyId = getTargetCompanyId(request);
    if (user.companyId !== targetCompanyId) {
      return forbidden(reply, 'You can only access resources belonging to your own company.');
    }
  };
}

module.exports = {
  hasPermission,
  requireAccessType,
  requireExactAccessType,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireOwnCompany,
};
