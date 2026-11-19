const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('./authChallenges.controller');
const service = require('./authChallenges.service');

function requestFor({ userId = 10, challengeOwnerId = 20 } = {}) {
  const lookupCalls = [];
  return {
    request: {
      user: { id: userId },
      body: { challengeId: '42', code: '123456' },
      server: {
        prisma: {
          authChallenge: {
            findUnique: async (args) => {
              lookupCalls.push(args);
              return { userId: challengeOwnerId };
            },
          },
        },
      },
    },
    reply: { send: (payload) => payload },
    lookupCalls,
  };
}

test('verifyChallengeHandler rejects a challenge owned by another authenticated user before verification', async () => {
  const original = service.verifyChallenge;
  let serviceCalled = false;
  service.verifyChallenge = async () => {
    serviceCalled = true;
    return { valid: true };
  };
  const { request, reply, lookupCalls } = requestFor({ userId: 10, challengeOwnerId: 20 });

  try {
    await assert.rejects(
      controller.verifyChallengeHandler(request, reply),
      (error) => error.status === 403 && error.code === 'FORBIDDEN',
    );
    assert.deepEqual(lookupCalls, [{ where: { id: 42 }, select: { userId: true } }]);
    assert.equal(serviceCalled, false);
  } finally {
    service.verifyChallenge = original;
  }
});

test('consumeChallengeHandler rejects a challenge owned by another authenticated user before consumption', async () => {
  const original = service.consumeChallenge;
  let serviceCalled = false;
  service.consumeChallenge = async () => {
    serviceCalled = true;
    return { consumed: true };
  };
  const { request, reply, lookupCalls } = requestFor({ userId: 10, challengeOwnerId: 20 });

  try {
    await assert.rejects(
      controller.consumeChallengeHandler(request, reply),
      (error) => error.status === 403 && error.code === 'FORBIDDEN',
    );
    assert.deepEqual(lookupCalls, [{ where: { id: 42 }, select: { userId: true } }]);
    assert.equal(serviceCalled, false);
  } finally {
    service.consumeChallenge = original;
  }
});

test('verify and consume handlers allow only the authenticated challenge owner to reach the service', async (t) => {
  for (const [name, handlerName, serviceName, result] of [
    ['verify', 'verifyChallengeHandler', 'verifyChallenge', { valid: true, remainingAttempts: 4 }],
    ['consume', 'consumeChallengeHandler', 'consumeChallenge', { consumed: true, purpose: 'PHONE_VERIFICATION', userId: 10 }],
  ]) {
    await t.test(name, async () => {
      const original = service[serviceName];
      let received;
      service[serviceName] = async (args) => {
        received = args;
        return result;
      };
      const { request, reply } = requestFor({ userId: 10, challengeOwnerId: 10 });

      try {
        const response = await controller[handlerName](request, reply);
        assert.deepEqual(received, { challengeId: '42', code: '123456' });
        assert.deepEqual(response, { success: true, data: result });
      } finally {
        service[serviceName] = original;
      }
    });
  }
});
