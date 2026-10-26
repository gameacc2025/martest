// Configurable SMS gateway adapter used by the notification outbox worker.
// The gateway receives { to, message } and must return a 2xx response on acceptance.
function hasRealProvider() {
  return Boolean(String(process.env.INQUIRY_SMS_GATEWAY_URL || '').trim()
    && String(process.env.INQUIRY_SMS_GATEWAY_TOKEN || '').trim());
}

async function sendSms({ to, body }) {
  const endpoint = String(process.env.INQUIRY_SMS_GATEWAY_URL || '').trim();
  const token = String(process.env.INQUIRY_SMS_GATEWAY_TOKEN || '').trim();
  if (!endpoint || !token) {
    const error = new Error('درگاه پیامک روی سرور پیکربندی نشده است.');
    error.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
  let url;
  try { url = new URL(endpoint); } catch {
    const error = new Error('نشانی درگاه پیامک معتبر نیست.');
    error.code = 'SMS_PROVIDER_CONFIGURATION_INVALID';
    error.statusCode = 500;
    throw error;
  }
  if (!['https:', ...(process.env.NODE_ENV === 'production' ? [] : ['http:'])].includes(url.protocol)) {
    const error = new Error('درگاه پیامک باید از HTTPS استفاده کند.');
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
  let response;
  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: recipient, message }),
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
  return { provider: 'configured-gateway' };
}

module.exports = { hasRealProvider, sendSms };
