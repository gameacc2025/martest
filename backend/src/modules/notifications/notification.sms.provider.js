// Twilio SMS provider adapter. Credentials are optional; without all three
// settings the worker leaves SMS outbox rows pending rather than simulating delivery.
const { twilioAccountSid, twilioAuthToken, twilioFromNumber, nodeEnv } = require('../../config/env');

function hasRealProvider() {
  return Boolean(twilioAccountSid && twilioAuthToken && twilioFromNumber && nodeEnv !== 'test');
}

async function sendSms({ to, body }) {
  if (!hasRealProvider()) {
    const error = new Error('ارائه‌دهنده پیامک تنظیم نشده است.');
    error.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
  const account = encodeURIComponent(twilioAccountSid);
  const form = new URLSearchParams({
    To: String(to || '').trim(),
    From: twilioFromNumber,
    Body: String(body || '').trim(),
  });
  if (!form.get('To') || !form.get('Body')) {
    const error = new Error('شماره گیرنده و متن پیامک الزامی است.');
    error.code = 'INVALID_SMS_PAYLOAD';
    error.statusCode = 400;
    throw error;
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Twilio SMS failed with HTTP ${response.status}`);
    error.code = 'SMS_PROVIDER_ERROR';
    error.statusCode = 502;
    throw error;
  }
  return { provider: 'twilio', messageId: payload.sid || null, status: payload.status || null };
}

module.exports = { hasRealProvider, sendSms };
