const prisma = require('../../config/db');
const { createPendingSubscription } = require('./inquiry-subscription.service');

function lockSubscriptionOwner(tx, ownerType, ownerId) {
  if (typeof tx.$queryRawUnsafe !== 'function') return Promise.resolve();
  const id = Number(ownerId);
  if (!Number.isInteger(id) || id < 1) return Promise.resolve();
  if (ownerType === 'company') return tx.$queryRawUnsafe('SELECT id FROM "Company" WHERE id = $1 FOR UPDATE', id);
  if (ownerType === 'user') return tx.$queryRawUnsafe('SELECT id FROM "User" WHERE id = $1 FOR UPDATE', id);
  return Promise.resolve();
}

async function createPendingWithOwnerLock(args) {
  return prisma.$transaction(async (tx) => {
    if (typeof tx.$queryRawUnsafe === 'function') await tx.$queryRawUnsafe('SELECT id FROM "InquiryPlan" WHERE id = $1 FOR UPDATE', Number(args.planId));
    await lockSubscriptionOwner(tx, args.ownerType, args.ownerId);
    return createPendingSubscription(args, tx);
  });
}

function zarinpalConfig() {
  const merchantId = String(process.env.ZARINPAL_MERCHANT_ID || '').trim();
  if (!merchantId) return null;
  const callbackUrl = String(process.env.ZARINPAL_CALLBACK_URL || '').trim();
  const resultUrl = String(process.env.INQUIRY_SUBSCRIPTION_RESULT_URL || '').trim();
  if (!callbackUrl || !resultUrl) {
    throw { statusCode: 500, code: 'PAYMENT_PROVIDER_CONFIGURATION_INVALID', message: 'نشانی بازگشت درگاه پرداخت پیکربندی نشده است.' };
  }
  let callback;
  let result;
  try {
    callback = new URL(callbackUrl);
    result = new URL(resultUrl);
  } catch {
    throw { statusCode: 500, code: 'PAYMENT_PROVIDER_CONFIGURATION_INVALID', message: 'نشانی بازگشت درگاه پرداخت معتبر نیست.' };
  }
  const sandbox = String(process.env.ZARINPAL_SANDBOX || '').toLowerCase() === 'true';
  if (!sandbox && (callback.protocol !== 'https:' || result.protocol !== 'https:')) {
    throw { statusCode: 500, code: 'PAYMENT_PROVIDER_CONFIGURATION_INVALID', message: 'در محیط واقعی، نشانی بازگشت پرداخت باید HTTPS باشد.' };
  }
  const baseUrl = sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
  const startPayBase = sandbox ? 'https://sandbox.zarinpal.com/pg/StartPay/' : 'https://www.zarinpal.com/pg/StartPay/';
  return { merchantId, callbackUrl: callback.toString(), resultUrl: result.toString(), sandbox, baseUrl, startPayBase };
}

function isZarinpalConfigured() {
  return Boolean(String(process.env.ZARINPAL_MERCHANT_ID || '').trim());
}

function makeResultUrl(config, status, subscriptionId, refId) {
  const url = new URL(config.resultUrl);
  url.searchParams.set('payment', status);
  if (subscriptionId) url.searchParams.set('subscriptionId', String(subscriptionId));
  if (refId) url.searchParams.set('refId', String(refId));
  return url.toString();
}

async function callZarinpal(config, endpoint, payload) {
  let response;
  try {
    response = await fetch(`${config.baseUrl}/pg/v4/payment/${endpoint}.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'martest-rfq-subscriptions/1.0' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw { statusCode: 502, code: 'PAYMENT_PROVIDER_UNAVAILABLE', message: 'ارتباط با درگاه پرداخت برقرار نشد.' };
  }
  if (!response.ok) throw { statusCode: 502, code: 'PAYMENT_PROVIDER_HTTP_ERROR', message: 'درگاه پرداخت پاسخ معتبر نداد.' };
  let result;
  try { result = await response.json(); } catch {
    throw { statusCode: 502, code: 'PAYMENT_PROVIDER_INVALID_RESPONSE', message: 'پاسخ درگاه پرداخت قابل خواندن نیست.' };
  }
  return result;
}

function amountInRial(plan) {
  const price = Number(plan.price);
  if (!Number.isSafeInteger(price) || price < 1) {
    throw { statusCode: 400, code: 'INVALID_PAYMENT_AMOUNT', message: 'مبلغ طرح باید عدد صحیح مثبت باشد.' };
  }
  if (plan.currency === 'IRR') return price;
  if (plan.currency === 'TOMAN') {
    const rial = price * 10;
    if (!Number.isSafeInteger(rial)) throw { statusCode: 400, code: 'INVALID_PAYMENT_AMOUNT', message: 'مبلغ طرح خارج از محدوده مجاز است.' };
    return rial;
  }
  throw { statusCode: 400, code: 'UNSUPPORTED_PAYMENT_CURRENCY', message: 'درگاه زرین‌پال فقط برای طرح‌های ریالی یا تومانی فعال است.' };
}

async function startSubscriptionPayment({ ownerType, ownerId, planId, paymentReference = null }) {
  const config = zarinpalConfig();
  if (!config) {
    const subscription = await createPendingWithOwnerLock({ ownerType, ownerId, planId, paymentReference });
    return { paymentMode: 'MANUAL_REVIEW', subscription, paymentUrl: null };
  }

  const prepared = await prisma.$transaction(async (tx) => {
    if (typeof tx.$queryRawUnsafe === 'function') await tx.$queryRawUnsafe('SELECT id FROM "InquiryPlan" WHERE id = $1 FOR UPDATE', Number(planId));
    await lockSubscriptionOwner(tx, ownerType, ownerId);
    const subscription = await createPendingSubscription({ ownerType, ownerId, planId, paymentReference: null }, tx);
    const amount = amountInRial(subscription.plan);
    const updated = await tx.inquirySubscription.update({
      where: { id: subscription.id },
      data: { paymentProvider: 'ZARINPAL', paymentAmount: amount, notes: 'در انتظار پرداخت آنلاین از طریق زرین‌پال.' },
      include: { plan: { select: { id: true, name: true, durationDays: true, price: true, currency: true } } },
    });
    return { subscription: updated, amount };
  });
  const subscription = prepared.subscription;
  const amount = prepared.amount;

  try {
    const result = await callZarinpal(config, 'request', {
      merchant_id: config.merchantId,
      amount,
      callback_url: config.callbackUrl,
      description: `اشتراک استعلام: ${String(subscription.plan.name || 'طرح استعلام').slice(0, 200)}`,
    });
    const code = Number(result?.data?.code);
    const authority = String(result?.data?.authority || '').trim();
    if (code !== 100 || !authority) {
      await prisma.inquirySubscription.updateMany({
        where: { id: subscription.id, status: 'PENDING_PAYMENT' },
        data: { status: 'CANCELLED', notes: `ایجاد درخواست پرداخت ناموفق بود (کد ${code || 'نامشخص'}).` },
      });
      throw { statusCode: 502, code: 'PAYMENT_REQUEST_REJECTED', message: 'درگاه پرداخت نتوانست درخواست پرداخت را ایجاد کند.' };
    }
    const updated = await prisma.inquirySubscription.update({
      where: { id: subscription.id },
      data: { paymentAuthority: authority, notes: 'در انتظار تکمیل پرداخت در زرین‌پال.' },
      include: { plan: { select: { id: true, name: true, durationDays: true, price: true, currency: true } } },
    });
    return { paymentMode: 'ONLINE', subscription: updated, paymentUrl: `${config.startPayBase}${encodeURIComponent(authority)}` };
  } catch (error) {
    if (error?.code === 'PAYMENT_REQUEST_REJECTED') throw error;
    await prisma.inquirySubscription.updateMany({
      where: { id: subscription.id, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED', notes: 'ایجاد پرداخت آنلاین ناموفق بود؛ لطفاً درخواست جدید ثبت کنید.' },
    });
    throw error;
  }
}

async function handleSubscriptionPaymentCallback(query = {}) {
  const config = zarinpalConfig();
  if (!config) throw { statusCode: 503, code: 'PAYMENT_PROVIDER_NOT_CONFIGURED', message: 'درگاه پرداخت آنلاین پیکربندی نشده است.' };
  const authority = String(query.Authority || '').trim();
  if (!authority || authority.length > 64) {
    return { payment: 'failed', redirectUrl: makeResultUrl(config, 'failed') };
  }

  const subscription = await prisma.inquirySubscription.findFirst({
    where: { paymentAuthority: authority, paymentProvider: 'ZARINPAL' },
    include: { plan: true },
  });
  if (!subscription) return { payment: 'failed', redirectUrl: makeResultUrl(config, 'failed') };
  if (String(query.Status || '').toUpperCase() !== 'OK') {
    await prisma.inquirySubscription.updateMany({
      where: { id: subscription.id, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED', notes: 'پرداخت توسط کاربر لغو شد.' },
    });
    return { payment: 'cancelled', subscriptionId: subscription.id, redirectUrl: makeResultUrl(config, 'cancelled', subscription.id) };
  }
  if (subscription.status === 'ACTIVE' && subscription.paymentVerifiedAt) {
    return { payment: 'success', subscriptionId: subscription.id, refId: subscription.paymentRefId, redirectUrl: makeResultUrl(config, 'success', subscription.id, subscription.paymentRefId) };
  }
  if (subscription.status !== 'PENDING_PAYMENT') {
    return { payment: 'failed', subscriptionId: subscription.id, redirectUrl: makeResultUrl(config, 'failed', subscription.id) };
  }

  let verification;
  try {
    verification = await callZarinpal(config, 'verify', {
      merchant_id: config.merchantId,
      amount: subscription.paymentAmount,
      authority,
    });
  } catch (error) {
    // Keep the subscription pending on a transient verification outage so
    // support can retry safely; never activate from callback query parameters alone.
    return { payment: 'pending', subscriptionId: subscription.id, redirectUrl: makeResultUrl(config, 'pending', subscription.id) };
  }
  const verifyCode = Number(verification?.data?.code);
  if (![100, 101].includes(verifyCode)) {
    await prisma.inquirySubscription.updateMany({
      where: { id: subscription.id, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED', notes: `تأیید پرداخت ناموفق بود (کد ${verifyCode || 'نامشخص'}).` },
    });
    return { payment: 'failed', subscriptionId: subscription.id, redirectUrl: makeResultUrl(config, 'failed', subscription.id) };
  }

  const refId = String(verification?.data?.ref_id || '').trim() || null;
  const activated = await prisma.$transaction(async (tx) => {
    const current = await tx.inquirySubscription.findUnique({ where: { id: subscription.id }, include: { plan: true } });
    if (!current) return null;
    if (current.status === 'ACTIVE' && current.paymentVerifiedAt) return current;
    if (current.status !== 'PENDING_PAYMENT') return null;
    if (typeof tx.$queryRawUnsafe === 'function') {
      if (current.companyId) await tx.$queryRawUnsafe('SELECT id FROM "Company" WHERE id = $1 FOR UPDATE', current.companyId);
      else await tx.$queryRawUnsafe('SELECT id FROM "User" WHERE id = $1 FOR UPDATE', current.userId);
    }
    const now = new Date();
    const active = await tx.inquirySubscription.findFirst({
      where: {
        ...(current.companyId ? { companyId: current.companyId } : { userId: current.userId }),
        status: 'ACTIVE',
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: { endsAt: 'desc' },
      select: { endsAt: true },
    });
    const startsAt = active?.endsAt && active.endsAt > now ? active.endsAt : now;
    const endsAt = new Date(startsAt.getTime() + current.plan.durationDays * 86400000);
    const updated = await tx.inquirySubscription.updateMany({
      where: { id: current.id, status: 'PENDING_PAYMENT' },
      data: {
        status: 'ACTIVE',
        startsAt,
        endsAt,
        paymentRefId: refId,
        paymentVerifiedAt: now,
        notes: [current.notes, 'پرداخت زرین‌پال در سمت سرور تأیید شد.'].filter(Boolean).join(' | ').slice(0, 2000),
      },
    });
    if (updated.count !== 1) return null;
    return tx.inquirySubscription.findUnique({ where: { id: current.id }, include: { plan: true } });
  }, { maxWait: 5000, timeout: 15000 });

  if (!activated) return { payment: 'failed', subscriptionId: subscription.id, redirectUrl: makeResultUrl(config, 'failed', subscription.id) };
  return { payment: 'success', subscriptionId: activated.id, refId, redirectUrl: makeResultUrl(config, 'success', activated.id, refId) };
}


async function retryPendingSubscriptionVerification({ ownerType, ownerId, subscriptionId }) {
  if (!['company', 'user'].includes(ownerType) || !Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
    throw { statusCode: 400, code: 'SUBSCRIPTION_OWNER_REQUIRED', message: 'شناسه صاحب اشتراک معتبر نیست.' };
  }
  const id = Number(subscriptionId);
  if (!Number.isInteger(id) || id < 1) {
    throw { statusCode: 400, code: 'INVALID_SUBSCRIPTION_ID', message: 'شناسه اشتراک معتبر نیست.' };
  }
  const ownerFilter = ownerType === 'company' ? { companyId: Number(ownerId) } : { userId: Number(ownerId) };
  const subscription = await prisma.inquirySubscription.findFirst({
    where: { id, ...ownerFilter, paymentProvider: 'ZARINPAL' },
    select: { id: true, status: true, paymentAuthority: true, paymentRefId: true, paymentVerifiedAt: true },
  });
  if (!subscription) throw { statusCode: 404, code: 'SUBSCRIPTION_NOT_FOUND', message: 'درخواست پرداخت آنلاین پیدا نشد.' };
  if (subscription.status === 'ACTIVE' && subscription.paymentVerifiedAt) {
    return { payment: 'success', subscriptionId: subscription.id, refId: subscription.paymentRefId };
  }
  if (subscription.status !== 'PENDING_PAYMENT' || !subscription.paymentAuthority) {
    throw { statusCode: 409, code: 'SUBSCRIPTION_NOT_PENDING', message: 'این درخواست پرداخت در وضعیت قابل بررسی مجدد نیست.' };
  }
  const result = await handleSubscriptionPaymentCallback({ Authority: subscription.paymentAuthority, Status: 'OK' });
  return { payment: result.payment, subscriptionId: subscription.id, refId: result.refId || null };
}

module.exports = { isZarinpalConfigured, startSubscriptionPayment, handleSubscriptionPaymentCallback, retryPendingSubscriptionVerification };
