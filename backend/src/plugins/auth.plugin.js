
// =============================================================
// Auth Plugin
//
// Registers @fastify/jwt and adds two decorators:
//
//   fastify.authenticate (onRequest hook)
//     - Verifies the access JWT from Authorization: Bearer <token>
//     - On success: sets request.user =
//         { id, email, roles[], permissions[], accessType, companyId }
//     - On failure: returns 401
//
//   fastify.authenticateRefresh (used only in /auth/refresh)
//     - Reads refresh token from httpOnly cookie
//     - Verifies it against DB hash
//     - On success: sets request.refreshTokenRecord
//
// Why two secrets:
//   Using separate secrets for access and refresh tokens means that
//   even if one secret leaks, the other token type remains secure.
// =============================================================

const fp = require('fastify-plugin');
const fastifyJwt = require('@fastify/jwt');
const fastifyCookie = require('@fastify/cookie');
const { jwtAccessSecret, jwtRefreshSecret } = require('../config/env');
const { verifyRefreshToken, hashRefreshToken } = require('../utils/token');
const prisma = require('../config/db');

module.exports = fp(async function authPlugin(fastify) {

  // Register cookie plugin (needed for httpOnly refresh token cookie)
  await fastify.register(fastifyCookie);

  // Register JWT plugin with the ACCESS token secret
  // (refresh token verification uses the utility function directly)
  await fastify.register(fastifyJwt, {
    secret: jwtAccessSecret,
    decode: { complete: true },
  });

  // ── Access Token Decorator ──────────────────────────────────
  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      // Verifies the token from Authorization: Bearer <token>
      await request.jwtVerify();

      // Ensure the token is an access token (not a refresh token)
      const payload = request.user;
      if (payload.type !== 'access') {
        return reply.code(401).send({
          error: true,
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type. Use the access token.',
        });
      }

      // Normalize: request.user =
      //   { id, email, roles[], permissions[], accessType, companyId }
      request.user = {
        id: payload.sub,
        email: payload.email ?? null,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        accessType: payload.accessType ?? null,
        companyId: payload.companyId ?? null,
      };

    } catch (err) {
      // Distinguish between expired and invalid tokens for better UX
      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        return reply.code(401).send({
          error: true,
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired. Use /api/v1/auth/refresh to get a new one.',
        });
      }
      return reply.code(401).send({
        error: true,
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing access token.',
      });
    }
  });

  // ── Refresh Token Decorator ─────────────────────────────────
  fastify.decorate('authenticateRefresh', async function authenticateRefresh(request, reply) {
    try {
      // Read refresh token from httpOnly cookie
      const rawToken = request.cookies?.refreshToken;
      if (!rawToken) {
        return reply.code(401).send({
          error: true,
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not found. Please log in again.',
        });
      }

      // Verify the JWT signature and expiry
      let payload;
      try {
        payload = verifyRefreshToken(fastify, rawToken);
      } catch {
        return reply.code(401).send({
          error: true,
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or expired. Please log in again.',
        });
      }

      if (payload.type !== 'refresh') {
        return reply.code(401).send({
          error: true,
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type.',
        });
      }

      // Look up the hashed token in DB (ensures it hasn't been revoked)
      const tokenHash = hashRefreshToken(rawToken);
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { user: { select: { id: true, email: true, status: true } } },
      });

      if (!tokenRecord) {
        // Token was revoked (logout) or never existed
        return reply.code(401).send({
          error: true,
          code: 'REFRESH_TOKEN_REVOKED',
          message: 'Refresh token has been revoked. Please log in again.',
        });
      }

      if (new Date() > tokenRecord.expiresAt) {
        // Expired in DB (clock drift edge case)
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        return reply.code(401).send({
          error: true,
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token expired. Please log in again.',
        });
      }

      if (tokenRecord.user.status !== 'ACTIVE') {
        return reply.code(401).send({
          error: {
            code: 'USER_DISABLED',
            message: 'User account is not active.',
          },
        });
      }

      // Attach token record to request for use in the refresh handler
      request.refreshTokenRecord = tokenRecord;
      request.rawRefreshToken = rawToken;

    } catch (err) {
      fastify.log.error(err, 'authenticateRefresh error');
      return reply.code(500).send({ error: true, message: 'Internal server error.' });
    }
  });
});
