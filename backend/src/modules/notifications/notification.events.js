// مسیر فایل: backend/src/modules/notifications/notification.events.js
// =============================================================
// Event catalog — the single source of truth for notification events
// (flow/06-plan-notifications.md §5, assembled from plan docs 01–04).
//
// Every module that wants to notify users MUST go through
// notification.dispatch.service.js with one of the event keys defined
// here — never prisma.notification.create directly.
//
// Contract per event:
//   key        stable string used in Notification.type / preferences / API
//   label      human label (Persian) for the preferences UI
//   sourceDoc  which plan doc promised this notification
//   recipients who receives it (documentation for integrators)
//   channels   per-channel defaults: IN_APP + EMAIL on, SMS off (opt-in).
//              The USER may override every channel per event — no channel
//              is ever mandatory (flow/06 §3 decision).
//   template(context) → { title, message, data } — Persian UI strings +
//              a structured payload for deep-linking. For events already
//              dispatched by existing modules (products) the templates
//              reproduce the EXACT strings those call sites used before.
//
// ORDER_* events are reserved: the legacy orders module was removed and
// the Order/Cart domain is being re-introduced separately. The event keys
// below are the agreed contract — order modules should dispatch these
// keys and MUST NOT invent their own names (see docs/NOTIFICATIONS.md).
// =============================================================

// =============================================================

const EVENT_CATALOG = {
  // ── Account / registration (flow/01) ───────────────────────
  // Company registration submitted → STAFF users allowed to approve companies.
  COMPANY_REGISTERED: {
    key: 'COMPANY_REGISTERED',
    label: 'ثبت‌نام شرکت',
    recipients: 'STAFF users holding the companies.activate permission (SUPER_ADMIN included)',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ company }) => ({
      title: 'ثبت‌نام شرکت جدید',
      message: `شرکت «${company?.name || company?.nameFa || 'نامشخص'}» در انتظار بررسی و تأیید است.`,
      data: { companyId: company?.id },
    }),
  },

  // Company registration reviewed (approve / reject / suspend ...) → its manager.
  COMPANY_STATUS_CHANGED: {
    key: 'COMPANY_STATUS_CHANGED',
    label: 'تغییر وضعیت شرکت',
    recipients: 'Company manager(s) of the affected company',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ company, status, reason }) => ({
      title: status === 'ACTIVE' ? 'تأیید ثبت‌نام شرکت' : 'تغییر وضعیت شرکت',
      message: status === 'ACTIVE'
        ? `ثبت‌نام شرکت «${company?.name || 'شما'}» تأیید شد. خوش آمدید.`
        : `وضعیت شرکت «${company?.name || 'شما'}» به ${status} تغییر کرد.${reason ? ` دلیل: ${reason}` : ''}`,
      data: { companyId: company?.id, status },
    }),
  },

  // ── Product lifecycle (flow/02) ────────────────────────────
  // Company submitted a product for review → STAFF reviewers.
  PRODUCT_SUBMITTED_FOR_REVIEW: {
    key: 'PRODUCT_SUBMITTED_FOR_REVIEW',
    label: 'ارسال محصول برای بررسی',
    recipients: 'STAFF users with product-review permission (currently: SUPER_ADMINs)',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    // Reproduces the exact strings product.service.js used pre-dispatch.
    template: ({ product }) => ({
      title: 'Product pending review',
      message: `Product "${product?.title}" status changed to PENDING_REVIEW.`,
      data: { productId: product?.id, status: 'PENDING_REVIEW' },
    }),
  },

  // Any non-submit workflow transition (approve/reject/publish/hide/archive/
  // restoreDraft) → company users of the owning company.
  PRODUCT_STATUS_CHANGED: {
    key: 'PRODUCT_STATUS_CHANGED',
    label: 'تغییر وضعیت محصول',
    recipients: 'Company users of the product-owning company',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ product, status, comment }) => {
      const reason = status === 'REJECTED' && comment ? ` Reason: ${comment}` : '';
      return {
        title: `Product ${String(status).toLowerCase().replace('_', ' ')}`,
        message: `Product "${product?.title}" status changed to ${status}.${reason}`,
        data: { productId: product?.id, status, comment: comment || null },
      };
    },
  },

  // A published product crossed the post-approval edit threshold and was
  // pushed back to PENDING_REVIEW → STAFF (products.review holders).
  PRODUCT_RE_REVIEW: {
    key: 'PRODUCT_RE_REVIEW',
    label: 'بازگشت محصول به بازبینی',
    recipients: 'STAFF users with product-review permission',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ product, threshold }) => ({
      title: 'بازبینی مجدد محصول',
      message: `محصول «${product?.title}» پس از ${threshold} ویرایش پس از تأیید به وضعیت در انتظار بررسی برگشت.`,
      data: { productId: product?.id, threshold },
    }),
  },

  // ── Inquiry / RFQ (flow/03) ────────────────────────────────
  INQUIRY_PUBLISHED: {
    key: 'INQUIRY_PUBLISHED',
    label: 'انتشار استعلام جدید',
    recipients: 'STAFF observers + all eligible companies (resolved by the inquiries module)',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ inquiry }) => ({
      title: 'استعلام جدید',
      message: `استعلام «${inquiry?.title || inquiry?.id || ''}» منتشر شد.`,
      data: { inquiryId: inquiry?.id },
    }),
  },

  INQUIRY_RESPONSE_RECEIVED: {
    key: 'INQUIRY_RESPONSE_RECEIVED',
    label: 'دریافت پاسخ استعلام',
    recipients: 'The requesting company (non-confidential responses)',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ inquiry, response }) => ({
      title: 'پاسخ جدید برای استعلام',
      message: `برای استعلام «${inquiry?.title || inquiry?.id || ''}» پاسخ جدیدی ثبت شد.`,
      data: { inquiryId: inquiry?.id, responseId: response?.id },
    }),
  },

  INQUIRY_RESPONSE_AUTO_REJECTED: {
    key: 'INQUIRY_RESPONSE_AUTO_REJECTED',
    label: 'رد خودکار پاسخ استعلام',
    recipients: 'Companies whose responses lost the selection',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ inquiry, company }) => ({
      title: 'پاسخ استعلام انتخاب نشد',
      message: `پاسخ شما به استعلام «${inquiry?.title || inquiry?.id || ''}» پس از انتخاب پاسخ برنده به‌صورت خودکار رد شد.`,
      data: { inquiryId: inquiry?.id, companyId: company?.id },
    }),
  },

  // Admin-created announcement sent to an explicitly selected audience.
  ADMIN_ANNOUNCEMENT: {
    key: 'ADMIN_ANNOUNCEMENT',
    label: 'اطلاعیه مدیریت',
    recipients: 'Active users selected by an authorized staff member',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ title, message }) => ({
      title: String(title || 'اطلاعیه جدید').trim(),
      message: String(message || 'اطلاعیه جدید از مدیریت').trim(),
      data: { source: 'admin' },
    }),
  },

  // ── Order / Cart (flow/04) — RESERVED contract, no Order model yet ──
  ORDER_PLACED: {
    key: 'ORDER_PLACED',
    label: 'ثبت سفارش',
    recipients: 'Customer + involved companies',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ order }) => ({
      title: 'ثبت سفارش',
      message: `سفارش شما با شماره ${order?.id ?? order?.reference ?? ''} ثبت شد.`,
      data: { orderId: order?.id },
    }),
  },

  ORDER_PAYMENT_FAILED: {
    key: 'ORDER_PAYMENT_FAILED',
    label: 'شکست پرداخت سفارش',
    recipients: 'Customer',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ order, reason }) => ({
      title: 'پرداخت سفارش ناموفق بود',
      message: `پرداخت سفارش ${order?.id ?? ''} ناموفق بود.${reason ? ` دلیل: ${reason}` : ''}`,
      data: { orderId: order?.id, reason: reason || null },
    }),
  },

  ORDER_ITEM_STATUS_CHANGED: {
    key: 'ORDER_ITEM_STATUS_CHANGED',
    label: 'تغییر وضعیت قلم سفارش',
    recipients: 'Customer',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ order, item, status }) => ({
      title: 'تغییر وضعیت قلم سفارش',
      message: `وضعیت قلم «${item?.name || item?.id || ''}» از سفارش ${order?.id ?? ''} به ${status} تغییر کرد.`,
      data: { orderId: order?.id, itemId: item?.id, status },
    }),
  },

  ORDER_UNANSWERED_REMINDER: {
    key: 'ORDER_UNANSWERED_REMINDER',
    label: 'یادآوری سفارش بی‌پاسخ',
    recipients: 'Company (order unanswered > 48h)',
    channels: { IN_APP: true, EMAIL: true, SMS: false },
    template: ({ order, company }) => ({
      title: 'یادآوری سفارش بی‌پاسخ',
      message: `سفارش ${order?.id ?? ''} بیش از ۴۸ ساعت بدون پاسخ است.`,
      data: { orderId: order?.id, companyId: company?.id },
    }),
  },
};

// Default channel matrix for every event (flow/06 §4): in-app + email ON,
// SMS off until the SMS credit system ships (future, per flow/06 §3.3).
const DEFAULT_CHANNELS = Object.freeze({
  IN_APP: true,
  EMAIL: true,
  SMS: false, // opt-in only — and SMS delivery is NOT implemented yet
});

/** @returns {NotificationEvent} */
function getEvent(key) {
  return EVENT_CATALOG[key] || null;
}

function isKnownEvent(key) {
  return Boolean(EVENT_CATALOG[key]);
}

/** All event keys — the stable contract surface. */
function listEventKeys() {
  return Object.keys(EVENT_CATALOG);
}

/** All events (copy) — for the preferences matrix and docs generation. */
function listEvents() {
  return Object.values(EVENT_CATALOG);
}

module.exports = {
  EVENT_CATALOG,
  DEFAULT_CHANNELS,
  getEvent,
  isKnownEvent,
  listEventKeys,
  listEvents,
};
