// =============================================================
// Unit tests — password utilities (generateRandomPassword, hash/verify)
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateRandomPassword, hashPassword, verifyPassword } = require('./password');

test('generateRandomPassword returns the requested length', () => {
  assert.equal(generateRandomPassword(12).length, 12);
  assert.equal(generateRandomPassword(20).length, 20);
  assert.equal(generateRandomPassword().length, 12); // default
});

test('generateRandomPassword does not repeat itself (CSPRNG, not a fixed pattern)', () => {
  const samples = new Set();
  for (let i = 0; i < 50; i++) {
    samples.add(generateRandomPassword(16));
  }
  // 50 independently-generated 16-char passwords should all be distinct.
  assert.equal(samples.size, 50);
});

test('generateRandomPassword only uses characters from the declared charset', () => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const pw = generateRandomPassword(200);
  for (const ch of pw) {
    assert.ok(charset.includes(ch), `unexpected character "${ch}" not in charset`);
  }
});

test('hashPassword + verifyPassword round-trip succeeds for the correct password', async () => {
  const plain = generateRandomPassword(14);
  const hash = await hashPassword(plain);

  assert.notEqual(hash, plain); // never store plaintext
  assert.ok(await verifyPassword(plain, hash));
});

test('verifyPassword rejects an incorrect password', async () => {
  const hash = await hashPassword('correct-horse-battery-staple');
  assert.equal(await verifyPassword('wrong-password', hash), false);
});