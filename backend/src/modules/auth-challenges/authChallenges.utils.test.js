const test = require('node:test');
const assert = require('node:assert/strict');
const { getClientIp } = require('./authChallenges.utils');

test('getClientIp: trusts Fastify-resolved IP, not raw forwarding headers', () => {
  const ip = getClientIp({
    ip: '203.0.113.10',
    socket: { remoteAddress: '10.0.0.4' },
    headers: {
      'x-forwarded-for': '198.51.100.99',
      'x-real-ip': '192.0.2.77',
    },
  });
  assert.equal(ip, '203.0.113.10');
});

test('getClientIp: falls back to the socket address when Fastify IP is absent', () => {
  assert.equal(getClientIp({ socket: { remoteAddress: '10.0.0.4' }, headers: { 'x-forwarded-for': '198.51.100.99' } }), '10.0.0.4');
});

test('getClientIp: returns unknown when no resolved address is available', () => {
  assert.equal(getClientIp({ headers: { 'x-forwarded-for': '198.51.100.99' } }), 'unknown');
});
