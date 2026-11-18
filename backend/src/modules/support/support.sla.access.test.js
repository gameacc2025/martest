const test = require('node:test');
const assert = require('node:assert/strict');
const { getSlaDetails } = require('./support.service');

function prismaReturningNoTicket(calls) {
  return {
    supportTicket: {
      findFirst: async (args) => {
        calls.push(args);
        return null;
      },
    },
  };
}

test('getSlaDetails scopes CUSTOMER requests to their own tickets', async () => {
  const calls = [];
  const user = { id: 17, accessType: 'CUSTOMER', roles: ['CUSTOMER_USER'] };

  const result = await getSlaDetails(prismaReturningNoTicket(calls), 42, user);

  assert.equal(result, null);
  assert.deepEqual(calls[0].where, { id: 42, requesterUserId: 17 });
});

test('getSlaDetails scopes COMPANY requests to tickets opened by their company', async () => {
  const calls = [];
  const user = { id: 23, accessType: 'COMPANY', companyId: 8 };

  const result = await getSlaDetails(prismaReturningNoTicket(calls), 42, user);

  assert.equal(result, null);
  assert.deepEqual(calls[0].where, { id: 42, requesterCompanyId: 8 });
});

test('getSlaDetails allows STAFF to inspect platform tickets', async () => {
  const calls = [];
  const user = { id: 3, accessType: 'STAFF' };

  const result = await getSlaDetails(prismaReturningNoTicket(calls), 42, user);

  assert.equal(result, null);
  assert.deepEqual(calls[0].where, { id: 42 });
});

test('getSlaDetails rejects callers without an authorized application context', async () => {
  const calls = [];
  const user = { id: 17, accessType: null, roles: [] };

  await assert.rejects(
    () => getSlaDetails(prismaReturningNoTicket(calls), 42, user),
    (error) => error.statusCode === 403 && error.code === 'SUPPORT_ACCESS_DENIED',
  );
  assert.equal(calls.length, 0);
});
