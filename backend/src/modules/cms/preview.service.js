// CMS Preview Service
//
// Generates and validates signed preview tokens for draft/review articles.
// Tokens are short-lived (default 1 hour) and single-use per session.

const crypto = require('node:crypto');
const prisma = require('../../config/db');

const PREVIEW_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const PREVIEW_TOKEN_BYTES = 32;

async function generatePreviewToken(articleId, userId) {
  const token = crypto.randomBytes(PREVIEW_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS);

  await prisma.cmsPreviewToken.create({
    data: {
      token,
      articleId,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

async function validatePreviewToken(token) {
  if (!token || typeof token !== 'string' || token.length !== PREVIEW_TOKEN_BYTES * 2) {
    return null;
  }

  const record = await prisma.cmsPreviewToken.findUnique({
    where: { token },
    include: { article: true },
  });

  if (!record) return null;
  if (record.consumedAt) return null;
  if (record.expiresAt < new Date()) return null;

  // Mark as consumed (single-use per session)
  await prisma.cmsPreviewToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return record.article;
}

async function cleanupExpiredTokens() {
  const now = new Date();
  return prisma.cmsPreviewToken.deleteMany({
    where: { expiresAt: { lt: now } },
  });
}

module.exports = {
  generatePreviewToken,
  validatePreviewToken,
  cleanupExpiredTokens,
  PREVIEW_TOKEN_TTL_MS,
};