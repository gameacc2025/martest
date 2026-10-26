// Twilio SMS adapter used by the notification outbox worker.
const { twilioAccountSid, twilioAuthToken, twilioFromNumber, nodeEnv } = require('../../config/env');

function hasRealProvider() {
  return Boolean(twilioAccountSid && twilioAuthToken && twilioFromNumber && nodeEnv !== 'test');
}

async function sendSms({ to, body }) {
  if (!hasRealProvider()) {
    const error = new Error('درگاه پیامک روی سرور پیکربندی نشده است.');
    error.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
  const recipient = String(to || '').trim();
  const message = String(body || '').trim();
  if (!recipient || !message) {
    const error = new Error('شماره گیرنده و متن پیامک الزامی است.');
    error.code = 'INVALID_SMS_PAYLOAD';
    error.statusCode = 400;
    throw error;
  }
  const account = encodeURIComponent(twilioAccountSid);
  const form = new URLSearchParams({ To: recipient, From: twilioFromNumber, Body: message });
  let response;
  try {
    response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    const error = new Error('ارتباط با درگاه پیامک برقرار نشد.');
    error.code = 'SMS_PROVIDER_UNAVAILABLE';
    error.statusCode = 502;
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'درگاه پیامک درخواست را نپذیرفت.');
    error.code = 'SMS_PROVIDER_REJECTED';
    error.statusCode = 502;
    throw error;
  }
  return { provider: 'twilio', messageId: payload.sid || null, status: payload.status || null };
}

module.exports = { hasRealProvider, sendSms };
