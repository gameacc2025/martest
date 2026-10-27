const test = require('node:test');
const assert = require('node:assert/strict');
const { hasRealProvider, sendSms } = require('./notification.sms.provider');

function withTwilioConfig(fn) {
  const old = {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM_NUMBER,
    fetch: global.fetch,
  };
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'unit-test-token';
  process.env.TWILIO_FROM_NUMBER = '+15005550006';
  return Promise.resolve().then(fn).finally(() => {
    if (old.sid === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = old.sid;
    if (old.token === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = old.token;
    if (old.from === undefined) delete process.env.TWILIO_FROM_NUMBER; else process.env.TWILIO_FROM_NUMBER = old.from;
    global.fetch = old.fetch;
  });
}

test('hasRealProvider requires all Twilio credentials', async () => {
  await withTwilioConfig(async () => {
    assert.equal(hasRealProvider(), true);
    delete process.env.TWILIO_FROM_NUMBER;
    assert.equal(hasRealProvider(), false);
  });
});

test('sendSms posts form-encoded data to Twilio and returns its message SID', async () => {
  await withTwilioConfig(async () => {
    let request;
    global.fetch = async (url, options) => {
      request = { url, options };
      return { ok: true, status: 201, json: async () => ({ sid: 'SM-unit-test' }) };
    };
    const result = await sendSms({ to: '+31612345678', body: 'Inquiry message alert' });
    assert.equal(request.url, 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json');
    assert.match(request.options.headers.authorization, /^Basic /);
    assert.equal(request.options.headers['content-type'], 'application/x-www-form-urlencoded');
    assert.equal(new URLSearchParams(request.options.body).get('To'), '+31612345678');
    assert.equal(new URLSearchParams(request.options.body).get('Body'), 'Inquiry message alert');
    assert.deepEqual(result, { provider: 'twilio', messageSid: 'SM-unit-test' });
  });
});

test('sendSms reports non-2xx provider responses without exposing provider details', async () => {
  await withTwilioConfig(async () => {
    global.fetch = async () => ({ ok: false, status: 401 });
    await assert.rejects(() => sendSms({ to: '+31612345678', body: 'Hello' }), (error) => error.code === 'SMS_PROVIDER_REJECTED' && error.statusCode === 502);
  });
});
