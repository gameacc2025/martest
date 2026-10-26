// Inquiry lifecycle worker: scheduled publishing and automatic expiry.
// All state changes use compare-and-set updates so multiple backend instances
// can safely poll the same rows without publishing/expiring them twice.
const prisma = require('../../config/db');
const { dispatchNotification } = require('../notifications/notification.dispatch.service');

async function notifyPublished(tx, inquiry) {
  const companyIds = [...new Set((inquiry.items || [])
    .map((item) => Number(item.product?.companyId))
    .filter((id) => Number.isInteger(id) && id > 0))];
  const context = { inquiry: { id: inquiry.id, title: inquiry.title } };

  if (companyIds.length) {
    await dispatchNotification('INQUIRY_PUBLISHED', { companyIds }, context, {
      tx,
      dedupeKey: (userId) => `inquiry-published-${inquiry.id}-companies-${userId}`,
    });
  }
  await dispatchNotification('INQUIRY_PUBLISHED', { permission: 'leads.read' }, context, {
    tx,
    dedupeKey: (userId) => `inquiry-published-${inquiry.id}-staff-${userId}`,
  });
}

async function notifyStatusChanged(tx, inquiry, status) {
  const context = { inquiry: { id: inquiry.id, title: inquiry.title }, status };
  const ownerRecipients = inquiry.buyerUserId
    ? [Number(inquiry.buyerUserId)]
    : (inquiry.companyId ? { companyIds: [Number(inquiry.companyId)] } : []);
  if (ownerRecipients.length) {
    await dispatchNotification('INQUIRY_STATUS_CHANGED', ownerRecipients, context, {
      tx,
      dedupeKey: (userId) => `inquiry-status-${inquiry.id}-${status}-owner-${userId}`,
    });
  }
  const companyIds = [...new Set((inquiry.responses || [])
    .filter((response) => response.status !== 'WITHDRAWN')
    .map((response) => Number(response.companyId))
    .filter((id) => Number.isInteger(id) && id > 0))];
  for (const companyId of companyIds) {
    await dispatchNotification('INQUIRY_STATUS_CHANGED', { companyIds: [companyId] }, context, {
      tx,
      dedupeKey: (userId) => `inquiry-status-${inquiry.id}-${status}-company-${companyId}-${userId}`,
    });
  }
}

async function processInquiryLifecycle({ now = new Date(), limit = 100 } = {}) {
  const dueToPublish = await prisma.inquiry.findMany({
    where: { status: 'SUBMITTED', publishDate: { lte: now } },
    select: { id: true },
    orderBy: { publishDate: 'asc' },
    take: limit,
  });
  const dueToExpire = await prisma.inquiry.findMany({
    where: { status: 'OPEN', autoClose: true, responseDeadline: { lte: now } },
    select: { id: true },
    orderBy: { responseDeadline: 'asc' },
    take: limit,
  });

  let published = 0;
  let expired = 0;

  for (const { id } of dueToPublish) {
    const changed = await prisma.$transaction(async (tx) => {
      const result = await tx.inquiry.updateMany({
        where: { id, status: 'SUBMITTED', publishDate: { lte: now } },
        data: { status: 'OPEN', closedAt: null },
      });
      if (!result.count) return false;
      await tx.inquiryStatusHistory.create({
        data: {
          inquiryId: id,
          previousStatus: 'SUBMITTED',
          newStatus: 'OPEN',
          changedByUserId: null,
          source: 'SYSTEM',
          comment: 'Scheduled publish date reached.',
        },
      });
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { items: { select: { product: { select: { companyId: true } } } } },
      });
      await notifyPublished(tx, inquiry);
      return true;
    });
    if (changed) published += 1;
  }

  for (const { id } of dueToExpire) {
    const changed = await prisma.$transaction(async (tx) => {
      const result = await tx.inquiry.updateMany({
        where: { id, status: 'OPEN', autoClose: true, responseDeadline: { lte: now } },
        data: { status: 'EXPIRED', closedAt: now },
      });
      if (!result.count) return false;
      await tx.inquiryStatusHistory.create({
        data: {
          inquiryId: id,
          previousStatus: 'OPEN',
          newStatus: 'EXPIRED',
          changedByUserId: null,
          source: 'SYSTEM',
          comment: 'Response deadline reached; automatic closure enabled.',
        },
      });
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { responses: { select: { companyId: true, status: true } } },
      });
      await notifyStatusChanged(tx, inquiry, 'EXPIRED');
      return true;
    });
    if (changed) expired += 1;
  }

  return { published, expired };
}

module.exports = { processInquiryLifecycle };
