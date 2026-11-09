// =============================================================
// Audit Log Utilities — Error factory and helpers
// =============================================================

/**
 * Create a structured error with HTTP status, code, and optional meta.
 *
 * @param {number} status - HTTP status code
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable message (Persian for user-facing)
 * @param {object} [meta] - Optional additional data
 * @returns {Error}
 */
function createError(status, code, message, meta = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.meta = meta;
  return err;
}

/**
 * Validate that the user has STAFF access type.
 * Call this in route handlers before calling service methods.
 */
function requireStaffAccess(user) {
  if (!user || !user.accessProfile || user.accessProfile.type !== 'STAFF') {
    throw createError(403, 'STAFF_CONTEXT_REQUIRED', 'این عملیات نیازمند دسترسی ادمین است.');
  }
  if (user.accessProfile.isActive === false) {
    throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
  }
}

/**
 * Check if user has a specific permission (for SUPER_ADMIN bypass, handled in frontend).
 * Backend routes should use fastify.hasPermission or similar.
 */
function checkPermission(user, permission) {
  // This is a placeholder - actual permission checking is done via
  // the auth plugin's hasPermission decorator in routes
  return true;
}

module.exports = {
  createError,
  requireStaffAccess,
  checkPermission,
};