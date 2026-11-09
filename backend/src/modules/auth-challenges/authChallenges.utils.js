// =============================================================
// Auth Challenges Utilities — Error factory and helpers
//
// Provides standardized error creation with consistent structure
// matching the existing auth module patterns.
// =============================================================

/**
 * Create a structured error with HTTP status, code, and optional meta.
 * Mirrors the error format used in auth module.
 *
 * @param {number} status - HTTP status code
 * @param {string} code - Machine-readable error code (e.g., 'INVALID_CODE')
 * @param {string} message - Human-readable message (Persian for user-facing)
 * @param {object} [meta] - Optional additional data (e.g., { retryAfter, remainingAttempts })
 * @returns {Error} Error with attached properties
 */
function createError(status, code, message, meta = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.meta = meta;
  return err;
}

/**
 * Wrap a service function to catch and format errors for the route handler.
 * Not strictly needed here since Fastify handles thrown errors via errorHandler,
 * but kept for consistency with auth module pattern.
 */
function toRouteHandler(handler) {
  return async (request, reply) => {
    try {
      return await handler(request, reply);
    } catch (err) {
      // Re-throw to let Fastify error handler process it
      throw err;
    }
  };
}

/**
 * Validate request body against a simple schema.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateBody(body, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, code: 'REQUIRED', message: `فیلد ${field} الزامی است.` });
      continue;
    }

    if (value === undefined || value === null) {
      continue; // Optional field not provided
    }

    if (rules.type && typeof value !== rules.type) {
      errors.push({ field, code: 'INVALID_TYPE', message: `فیلد ${field} باید از نوع ${rules.type} باشد.` });
    }

    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({ field, code: 'INVALID_VALUE', message: `مقدار ${field} معتبر نیست.` });
    }

    if (rules.minLength !== undefined && String(value).length < rules.minLength) {
      errors.push({ field, code: 'TOO_SHORT', message: `فیلد ${field} باید حداقل ${rules.minLength} کاراکتر باشد.` });
    }

    if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
      errors.push({ field, code: 'TOO_LONG', message: `فیلد ${field} باید حداکثر ${rules.maxLength} کاراکتر باشد.` });
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({ field, code: 'INVALID_FORMAT', message: `فرمت ${field} معتبر نیست.` });
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Extract IP address from request for rate limiting.
 */
function getClientIp(request) {
  // Check standard proxy headers first
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }
  // Fallback to Fastify's remoteAddress
  return request.ip || request.socket?.remoteAddress || 'unknown';
}

module.exports = {
  createError,
  toRouteHandler,
  validateBody,
  getClientIp,
};