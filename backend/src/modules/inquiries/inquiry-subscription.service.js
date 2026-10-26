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

async function consumeUsage({ ownerType, ownerId, usageType, referenceType = null, referenceId = null, idempotencyKey = null, forceEnforcement = false, tx = prisma }) {
  if (!Object.hasOwn(LIMIT_BY_USAGE, usageType)) {
    throw { statusCode: 400, code: 'INVALID_INQUIRY_USAGE_TYPE', message: 'نوع مصرف اشتراک معتبر نیست.' };
  }
  if (!(await enforcementEnabled(tx)) && usageType !== 'SMS') return { enforced: false, remaining: null, limit: null, used: null };

  const subscription = await getActiveSubscription(ownerType, ownerId, tx);
  if (!subscription) {
    throw quotaError('INQUIRY_SUBSCRIPTION_REQUIRED', 'برای استفاده از این قابلیت، اشتراک فعال لازم است.', { ownerType, ownerId });
  }

  // Serialize quota decisions for a subscription so simultaneous requests cannot
  // both observe the same remaining slot and overspend the allowance.
  if (typeof tx.$queryRawUnsafe === 'function') {
    await tx.$queryRawUnsafe('SELECT id FROM "InquirySubscription" WHERE id = $1 FOR UPDATE', subscription.id);
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
  const enforced = await enforcementEnabled(client);
  const capabilities = { smsConfigured: Boolean(process.env.INQUIRY_SMS_GATEWAY_URL && process.env.INQUIRY_SMS_GATEWAY_TOKEN) };
  // SMS is a separately metered paid service, so its allowance remains visible
  // and enforced even while inquiry/response quota enforcement is in rollout.
  if (!enforced && !capabilities.smsConfigured) return { enforced: false, subscription: null, quotas: null, capabilities };
  const subscription = await getActiveSubscription(ownerType, ownerId, client, now);
  if (!subscription) return { enforced, subscription: null, quotas: null, capabilities };
  const quotas = {};
  for (const [usageType, field] of Object.entries(LIMIT_BY_USAGE)) {
    if (!enforced && usageType !== 'SMS') continue;
    const used = await getUsage(subscription.id, usageType, subscription.startsAt, client);
    const limit = subscription.plan[field];
    quotas[usageType] = { used, limit, remaining: Math.max(0, limit - used) };
  }
  return {
    enforced,
    subscription: { id: subscription.id, planId: subscription.planId, planName: subscription.plan.name, startsAt: subscription.startsAt, endsAt: subscription.endsAt, status: subscription.status },
    quotas,
    capabilities,
  };
}


async function listActivePlans(client = prisma) {
  return client.inquiryPlan.findMany({
    where: { isActive: true },
    select: {
      id: true, code: true, name: true, description: true, durationDays: true,
      price: true, currency: true, inquiriesPerPeriod: true, responsesPerPeriod: true,
      internalMessagesPerPeriod: true, smsPerPeriod: true,
    },
    orderBy: [{ price: 'asc' }, { id: 'asc' }],
  });
}

async function createPendingSubscription({ ownerType, ownerId, planId, paymentReference = null }, client = prisma) {
  if (!['company', 'user'].includes(ownerType) || !Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
    throw { statusCode: 400, code: 'SUBSCRIPTION_OWNER_REQUIRED', message: 'شناسه صاحب اشتراک معتبر نیست.' };
  }
  const normalizedPlanId = Number(planId);
  if (!Number.isInteger(normalizedPlanId) || normalizedPlanId < 1) {
    throw { statusCode: 400, code: 'INVALID_INQUIRY_PLAN', message: 'طرح اشتراک معتبر نیست.' };
  }
  const ownerFilter = ownerType === 'company' ? { companyId: Number(ownerId) } : { userId: Number(ownerId) };
  const plan = await client.inquiryPlan.findFirst({ where: { id: normalizedPlanId, isActive: true } });
  if (!plan) throw { statusCode: 404, code: 'INQUIRY_PLAN_NOT_FOUND', message: 'طرح اشتراک فعال پیدا نشد.' };

  const active = await getActiveSubscription(ownerType, ownerId, client);
  if (active) throw { statusCode: 409, code: 'ACTIVE_SUBSCRIPTION_EXISTS', message: 'در حال حاضر اشتراک فعال دارید.' };

  const pending = await client.inquirySubscription.findFirst({
    where: { ...ownerFilter, status: 'PENDING_PAYMENT', planId: normalizedPlanId },
    select: { id: true },
  });
  if (pending) throw { statusCode: 409, code: 'PENDING_SUBSCRIPTION_EXISTS', message: 'برای این طرح درخواست پرداخت ثبت‌شده و در انتظار بررسی دارید.', details: { subscriptionId: pending.id } };

  const reference = typeof paymentReference === 'string' ? paymentReference.trim() : '';
  if (reference.length > 120) throw { statusCode: 400, code: 'INVALID_PAYMENT_REFERENCE', message: 'شماره پیگیری حداکثر باید ۱۲۰ نویسه باشد.' };

  return client.inquirySubscription.create({
    data: {
      planId: normalizedPlanId,
      ...ownerFilter,
      status: 'PENDING_PAYMENT',
      paymentReference: reference || null,
      notes: 'در انتظار بررسی دستی پرداخت؛ شماره پیگیری به‌تنهایی تأیید پرداخت محسوب نمی‌شود.',
    },
    include: { plan: { select: { id: true, name: true, durationDays: true, price: true, currency: true } } },
  });
}

async function expireElapsedSubscriptions(client = prisma, now = new Date()) {
  if (typeof client.inquirySubscription?.updateMany !== 'function') return;
  await client.inquirySubscription.updateMany({
    where: { status: 'ACTIVE', endsAt: { lte: now } },
    data: { status: 'EXPIRED' },
  });
}

async function getMySubscriptions(ownerType, ownerId, client = prisma) {
  await expireElapsedSubscriptions(client);
  if (!['company', 'user'].includes(ownerType) || !Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
    throw { statusCode: 400, code: 'SUBSCRIPTION_OWNER_REQUIRED', message: 'شناسه صاحب اشتراک معتبر نیست.' };
  }
  const ownerFilter = ownerType === 'company' ? { companyId: Number(ownerId) } : { userId: Number(ownerId) };
  return client.inquirySubscription.findMany({
    where: ownerFilter,
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { plan: { select: { id: true, code: true, name: true, durationDays: true, price: true, currency: true, inquiriesPerPeriod: true, responsesPerPeriod: true, internalMessagesPerPeriod: true, smsPerPeriod: true } } },
  });
}

module.exports = { LIMIT_BY_USAGE, enforcementEnabled, getActiveSubscription, getQuotaSummary, consumeUsage, listActivePlans, createPendingSubscription, getMySubscriptions, expireElapsedSubscriptions };
