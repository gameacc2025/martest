const nodemailer = require('nodemailer');
const {
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  smtpFrom,
  contactInboxEmail,
} = require('../../config/env');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const SUBJECTS = Object.freeze({
  product_question: 'سؤال درباره محصول',
  order_issue: 'پیگیری سفارش',
  partnership: 'پیشنهاد همکاری',
  bug_report: 'گزارش مشکل',
  general_question: 'سؤال عمومی',
});

function buildContactAuditSnapshot({ phone, subject, message }) {
  // Contact names, addresses, phone numbers, email addresses and message
  // contents belong in the support mailbox, not in long-lived AuditLog rows.
  return {
    subject,
    hasPhone: Boolean(phone),
    messageLength: String(message || '').length,
  };
}

function serviceUnavailable() {
  return {
    statusCode: 503,
    code: 'CONTACT_DELIVERY_NOT_CONFIGURED',
    message: 'سرویس دریافت پیام در حال حاضر پیکربندی نشده است.',
  };
}

async function sendContactMessage({ name, email, phone, subject, message, requestContext = {} }) {
  if (!smtpHost || !contactInboxEmail || !smtpFrom) {
    throw serviceUnavailable();
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  const subjectLabel = SUBJECTS[subject];
  if (!subjectLabel) {
    throw {
      statusCode: 400,
      code: 'INVALID_CONTACT_SUBJECT',
      message: 'موضوع پیام نامعتبر است.',
    };
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: contactInboxEmail,
    replyTo: email,
    subject: `پیام فرم تماس: ${subjectLabel}`,
    text: [
      `نام: ${name}`,
      `ایمیل: ${email}`,
      `تلفن: ${phone || 'ثبت نشده'}`,
      `موضوع: ${subjectLabel}`,
      '',
      'متن پیام:',
      message,
    ].join('\n'),
  });

  // Record audit log for contact form submission
  await recordAuditLogExplicit({
    actorUserId: requestContext.userId || null,
    actorAccessType: requestContext.accessType || 'PUBLIC',
    companyId: null,
    source: 'WEBSITE',
    action: AUDIT_ACTIONS.CONTACT_SUBMITTED,
    entityType: 'ContactMessage',
    entityId: `contact-${Date.now()}`,
    after: buildContactAuditSnapshot({ phone, subject, message }),
    ipAddress: requestContext.ipAddress || 'unknown',
    userAgent: requestContext.userAgent || 'unknown',
  });

  return { success: true };
}

module.exports = { sendContactMessage, SUBJECTS, buildContactAuditSnapshot };
