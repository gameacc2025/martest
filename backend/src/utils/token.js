// =============================================================
// Token Utilities
//
// Handles:
//   1. JWT access token  — short-lived (15m), carries roles & permissions
//   2. JWT refresh token — long-lived (7d), stored hashed in DB + httpOnly cookie
//   3. Refresh token hashing — we never store the raw token in DB;
//      we store a SHA-256 hash so a DB breach doesn't expose tokens
//
// Token Payload:
//   Access token:  { sub, email, roles[], permissions[],
//                    accessType, companyId, type:'access' }
//   Refresh token: { sub, type:'refresh' }
//   (keeping refresh payload minimal — less data exposed if decoded)
//
// Domain model note:
//   `sub` is the User id (authentication identity). `accessType` is the
//   AccessProfile.type (STAFF | COMPANY | CUSTOMER) and `companyId` comes
//   from the AccessProfile (null for STAFF/CUSTOMER without a company).
//
// Why roles/permissions live in the access token:
//   - Avoids a DB permission lookup on every authenticated request
//   - Token is short-lived (15m), so revoking a permission takes at most 15m
//   - For real-time revocation, on logout/password-change we delete all refresh
//     tokens so the user must re-login and get a fresh access token
// =============================================================

const crypto = require('crypto');
const {
  jwtAccessSecret,
  jwtAccessExpiresIn,
  jwtRefreshSecret,
  jwtRefreshExpiresIn,
} = require('../config/env');

/**
 * Sign an access JWT.
 * @param {object} fastify - Fastify instance (has jwt.sign)
 * @param {object} payload - { id, email, roles[], permissions[], accessType, companyId }
 * @returns {string} signed JWT
 */
function signAccessToken(fastify, payload) {
  return fastify.jwt.sign(
    {
      sub: payload.id,
      email: payload.email ?? null,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      accessType: payload.accessType ?? null,
      companyId: payload.companyId ?? null,
      type: 'access',
    },
    { key: jwtAccessSecret, expiresIn: jwtAccessExpiresIn }
  );
}

/**
 * Sign a refresh JWT.
 * @param {object} fastify
 * @param {number} userId
 * @returns {string} signed JWT
 */
function signRefreshToken(fastify, userId) {
  return fastify.jwt.sign(
    { sub: userId, type: 'refresh' },
    { key: jwtRefreshSecret, expiresIn: jwtRefreshExpiresIn }
  );
}

/**
 * Verify a refresh JWT.
 * @param {object} fastify
 * @param {string} token
 * @returns {object} decoded payload
 * @throws if invalid or expired
 */
function verifyRefreshToken(fastify, token) {
  return fastify.jwt.verify(token, { key: jwtRefreshSecret });
}

/**
 * Hash a refresh token for safe DB storage.
 * SHA-256 is fast (not bcrypt) because:
 *   - Tokens are already long random strings (high entropy)
 *   - We only need to prevent DB dump from exposing active tokens
 *   - Lookup by hash must be fast
 * @param {string} token
 * @returns {string} hex hash
 */
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate the expiry Date from the refresh token expiry string.
 * Converts '7d', '30d', '1h', '15m' etc. to a Date object.
 * @returns {Date}
 */
function getRefreshTokenExpiry() {
  const str = jwtRefreshExpiresIn;
  const unit = str.slice(-1);
  const value = parseInt(str.slice(0, -1), 10);
  const ms =
    unit === 'd' ? value * 86400000
    : unit === 'h' ? value * 3600000
    : unit === 'm' ? value * 60000
    : value * 1000;
  return new Date(Date.now() + ms);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
};
