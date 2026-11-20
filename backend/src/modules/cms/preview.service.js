// CMS Preview Service
//
// Generates and validates signed preview tokens for draft/review articles.
// Tokens are short-lived (default 1 hour) and single-use per session.

const crypto = require('node:crypto');
const prisma = require('../../config/db');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const PREVIEW_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const PREVIEW_TOKEN_BYTES = 32;

async function generatePreviewToken(articleId, userId) {
  const token = crypto.randomBytes(PREVIEW_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS);

  await prisma.$transaction(async (tx) => {
    const record = await tx.cmsPreviewToken.create({
      data: { token, articleId, userId, expiresAt },
      select: { id: true, articleId: true, userId: true, expiresAt: true },
    });
    await recordAuditLogExplicit({
      tx,
      actorUserId: userId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_PREVIEW_TOKEN_CREATED,
      entityType: 'CmsPreviewToken',
      entityId: record.id,
      metadata: { articleId, expiresAt: expiresAt.toISOString() },
    });
  });

  return { token, expiresAt };
}

async function validatePreviewToken(token) {
  if (!token || typeof token !== 'string' || token.length !== PREVIEW_TOKEN_BYTES * 2) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.cmsPreviewToken.findUnique({
      where: { token },
      include: { article: true },
    });

    if (!record || record.consumedAt || record.expiresAt < new Date()) return null;

    const consumedAt = new Date();
    const claimed = await tx.cmsPreviewToken.updateMany({
      where: { id: record.id, consumedAt: null, expiresAt: { gt: consumedAt } },
      data: { consumedAt },
    });
    if (claimed.count !== 1) return null;

    await recordAuditLogExplicit({
      tx,
      actorUserId: record.userId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_PREVIEW_TOKEN_CONSUMED,
      entityType: 'CmsPreviewToken',
      entityId: record.id,
      metadata: { articleId: record.articleId, consumedAt: consumedAt.toISOString() },
    });

    return record.article;
  });
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