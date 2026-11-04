// Twilio SMS adapter used by the notification outbox worker.
// Inquiry SMS is queued only after the sender's paid SMS allowance is consumed.
function hasRealProvider() {
  return Boolean(
    String(process.env.TWILIO_ACCOUNT_SID || '').trim()
    && String(process.env.TWILIO_AUTH_TOKEN || '').trim()
    && String(process.env.TWILIO_FROM_NUMBER || '').trim(),
  );
}

async function sendSms({ to, body }) {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  const from = String(process.env.TWILIO_FROM_NUMBER || '').trim();
  if (!accountSid || !authToken || !from) {
    const error = new Error('درگاه پیامک روی سرور پیکربندی نشده است.');
    error.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
  if (!accountSid.startsWith('AC') || from.length > 40) {
    const error = new Error('تنظیمات درگاه پیامک معتبر نیست.');
    error.code = 'SMS_PROVIDER_CONFIGURATION_INVALID';
    error.statusCode = 500;
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

  const authorization = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const payload = new URLSearchParams({ To: recipient, From: from, Body: message }).toString();
  let response;
  try {
    response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: { authorization: `Basic ${authorization}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: payload,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    const error = new Error('ارتباط با درگاه پیامک برقرار نشد.');
    error.code = 'SMS_PROVIDER_UNAVAILABLE';
    error.statusCode = 502;
    throw error;
  }
  if (!response.ok) {
    const error = new Error('درگاه پیامک درخواست را نپذیرفت.');
    error.code = 'SMS_PROVIDER_REJECTED';
    error.statusCode = 502;
    throw error;
  }
  let result = {};
  try { result = await response.json(); } catch { /* Twilio may return an empty success body in test doubles. */ }
  return { provider: 'twilio', messageSid: result.sid || null };
}

module.exports = { hasRealProvider, sendSms };
