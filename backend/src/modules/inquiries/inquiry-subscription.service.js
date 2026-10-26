// RFQ subscription and usage enforcement.
// Enforcement is intentionally rollout-gated by SystemSetting so the schema can
// be deployed and plans configured before existing users are required to pay.
const prisma = require('../../config/db');

const LIMIT_BY_USAGE = Object.freeze({
  INQUIRY_CREATE: 'inquiriesPerPeriod',
  RESPONSE_SUBMIT: 'responsesPerPeriod',
  INTERNAL_MESSAGE: 'internalMessagesPerPeriod',
  SMS: 'smsPerPeriod',
});

function quotaError(code, message, details) {
  return { statusCode: 403, code, message, details };
}

async function enforcementEnabled(client) {
  if (typeof client?.systemSetting?.findUnique !== 'function') return false;
  const setting = await client.systemSetting.findUnique({
    where: { key: 'inquiry.subscription_enforcement' },
    select: { value: true },
  });
  return setting?.value === 'true';
}

async function getActiveSubscription(ownerType, ownerId, client = prisma, now = new Date()) {
  if (!['company', 'user'].includes(ownerType) || !Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
    throw { statusCode: 400, code: 'SUBSCRIPTION_OWNER_REQUIRED', message: 'شناسه صاحب اشتراک معتبر نیست.' };
  }
  const ownerFilter = ownerType === 'company' ? { companyId: Number(ownerId) } : { userId: Number(ownerId) };
  return client.inquirySubscription.findFirst({
    where: {
      ...ownerFilter,
      status: 'ACTIVE',
      startsAt: { lte: now },
      endsAt: { gt: now },
      plan: { is: { isActive: true } },
    },
    include: { plan: true },
    orderBy: { endsAt: 'desc' },
  });
}

async function getUsage(subscriptionId, usageType, startsAt, client = prisma) {
  const result = await client.inquiryUsageEvent.aggregate({
    where: { subscriptionId, usageType, createdAt: { gte: startsAt } },
    _sum: { quantity: true },
  });
  return result._sum.quantity || 0;
}

async function consumeUsage({ ownerType, ownerId, usageType, referenceType = null, referenceId = null, idempotencyKey = null, tx = prisma }) {
  if (!Object.hasOwn(LIMIT_BY_USAGE, usageType)) {
    throw { statusCode: 400, code: 'INVALID_INQUIRY_USAGE_TYPE', message: 'نوع مصرف اشتراک معتبر نیست.' };
  }
  if (!(await enforcementEnabled(tx))) return { enforced: false, remaining: null, limit: null, used: null };

  const subscription = await getActiveSubscription(ownerType, ownerId, tx);
  if (!subscription) {
    throw quotaError('INQUIRY_SUBSCRIPTION_REQUIRED', 'برای استفاده از این قابلیت، اشتراک فعال لازم است.', { ownerType, ownerId });
  }

  const limitField = LIMIT_BY_USAGE[usageType];
  const limit = subscription.plan[limitField];
  if (!Number.isInteger(limit) || limit < 0) {
    throw { statusCode: 500, code: 'INVALID_INQUIRY_PLAN_LIMIT', message: 'محدودیت تعریف‌شده برای طرح اشتراک معتبر نیست.', details: { planId: subscription.planId, limitField } };
  }
  const used = await getUsage(subscription.id, usageType, subscription.startsAt, tx);
  if (used >= limit) {
    throw quotaError('INQUIRY_QUOTA_EXCEEDED', 'سهمیه این قابلیت در اشتراک شما به پایان رسیده است.', {
      usageType, used, limit, remaining: 0, subscriptionId: subscription.id, endsAt: subscription.endsAt,
    });
  }

  await tx.inquiryUsageEvent.create({
    data: {
      subscriptionId: subscription.id,
      usageType,
      quantity: 1,
      referenceType,
      referenceId: referenceId == null ? null : String(referenceId),
      idempotencyKey: idempotencyKey || null,
    },
  });
  return { enforced: true, used: used + 1, limit, remaining: Math.max(0, limit - used - 1), subscriptionId: subscription.id, endsAt: subscription.endsAt };
}

async function getQuotaSummary(ownerType, ownerId, client = prisma, now = new Date()) {
  if (!(await enforcementEnabled(client))) return { enforced: false, subscription: null, quotas: null };
  const subscription = await getActiveSubscription(ownerType, ownerId, client, now);
  if (!subscription) return { enforced: true, subscription: null, quotas: null };
  const quotas = {};
  for (const [usageType, field] of Object.entries(LIMIT_BY_USAGE)) {
    const used = await getUsage(subscription.id, usageType, subscription.startsAt, client);
    const limit = subscription.plan[field];
    quotas[usageType] = { used, limit, remaining: Math.max(0, limit - used) };
  }
  return {
    enforced: true,
    subscription: { id: subscription.id, planId: subscription.planId, planName: subscription.plan.name, startsAt: subscription.startsAt, endsAt: subscription.endsAt, status: subscription.status },
    quotas,
  };
}

module.exports = { LIMIT_BY_USAGE, enforcementEnabled, getActiveSubscription, getQuotaSummary, consumeUsage };
