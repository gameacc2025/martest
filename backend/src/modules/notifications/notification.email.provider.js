// مسیر فایل: backend/src/modules/notifications/notification.email.provider.js
// =============================================================
// Email Provider Adapter
//
// Abstraction layer for sending emails. The delivery worker uses
// this interface; real implementations (SMTP via nodemailer, SendGrid,
// etc.) can be swapped without changing the worker logic.
// =============================================================

const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, nodeEnv } = require('../../config/env');

/**
 * Send an email.
 * @param {Object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.subject - Email subject
 * @param {string} opts.text - Plain text body
 * @param {string} [opts.html] - Optional HTML body
 * @returns {Promise<{ messageId: string, provider: string }>} Provider-specific result
 */
async function sendEmail({ to, subject, text, html }) {
  // If SMTP is not configured, fall back to console adapter (dev/test only)
  if (!smtpHost || nodeEnv === 'test') {
    return sendEmailConsole({ to, subject, text, html });
  }

  // If nodemailer is available, use it
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    // nodemailer not installed — use console adapter
    console.warn('[email] nodemailer not installed, using console adapter');
    return sendEmailConsole({ to, subject, text, html });
  }

  // Create transporter lazily
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });

  return { messageId: info.messageId, provider: 'smtp' };
}

/**
 * Console adapter — logs the email to stdout. Used when no real
 * provider is configured (local dev, CI, tests).
 */
async function sendEmailConsole({ to, subject, text, html }) {
  const separator = '─'.repeat(60);
  console.log('\n' + separator);
  console.log('[EMAIL CONSOLE ADAPTER]');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text: ${text}`);
  if (html) console.log(`HTML: ${html}`);
  console.log(separator + '\n');

  // Generate a fake message ID for tracking
  const messageId = `console-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { messageId, provider: 'console' };
}

/**
 * Check if a real email provider is available.
 * @returns {boolean}
 */
function hasRealProvider() {
  return Boolean(smtpHost && nodeEnv !== 'test');
}

module.exports = {
  sendEmail,
  sendEmailConsole,
  hasRealProvider,
};