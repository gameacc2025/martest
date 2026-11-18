const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

injectMock('../../config/db', {});
injectMock('../notifications/notification.dispatch.service', { dispatchNotification: async () => ({}) });
const service = require('./support.service');

const calendar = {
  timezone: 'UTC',
  workDays: [1, 2, 3, 4, 5],
  workStartHour: 9,
  workEndHour: 18,
  holidays: [],
};
const policy = {
  id: 1,
  priority: 'NORMAL',
  firstResponseMinutes: 360,
  resolutionMinutes: 480,
  workingCalendar: calendar,
  isActive: true,
};

function makePrisma() {
  const ticket = {
    id: 51,
    status: 'OPEN',
    priority: 'NORMAL',
    categoryId: 2,
    createdAt: new Date(2026, 10, 16, 9, 0),
    firstResponseDueAt: new Date(2026, 10, 16, 15, 0),
    resolveDueAt: new Date(2026, 10, 16, 17, 0),
    firstRespondedAt: null,
    resolvedAt: null,
    closedAt: null,
    category: { slaPolicies: [policy] },
  };
  const events = [];
  const prisma = {
    supportTicket: {
      findUnique: async () => ({ ...ticket }),
      findFirst: async ({ where }) => where.id === ticket.id ? { ...ticket } : null,
      update: async ({ data }) => {
        Object.assign(ticket, data);
        return { ...ticket };
      },
    },
    supportEvent: {
      findFirst: async ({ where }) => events
        .filter((event) => event.ticketId === where.ticketId && event.eventType === where.eventType)
        .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0] || null,
      create: async ({ data }) => {
        const event = { id: events.length + 1, ...data };
        events.push(event);
        return event;
      },
    },
    supportSlaPolicy: {
      findFirst: async () => null,
    },
    $transaction: async (callback) => callback(prisma),
  };
  return { prisma, ticket, events };
}

test('calculateWorkingMinutesBetween excludes nights and non-working days', () => {
  const monday = new Date(2026, 10, 16, 17, 0);
  const tuesday = new Date(2026, 10, 17, 10, 0);
  assert.equal(service.calculateWorkingMinutesBetween(monday, tuesday, calendar), 120);
});

test('active SLA pause freezes both displayed deadlines by working time', async () => {
  const { prisma } = makePrisma();
  const pausedAt = new Date(2026, 10, 16, 10, 0);
  const now = new Date(2026, 10, 16, 11, 0);
  await service.pauseSla(prisma, 51, 7, 'Waiting for customer', pausedAt);

  const details = await service.getSlaDetails(prisma, 51, { id: 7, accessType: 'STAFF' }, now);
  assert.equal(details.isPaused, true);
  assert.equal(details.pausedAt.getTime(), pausedAt.getTime());
  assert.equal(details.firstResponse.dueAt.getTime(), new Date(2026, 10, 16, 16, 0).getTime());
  assert.equal(details.resolution.dueAt.getTime(), new Date(2026, 10, 16, 18, 0).getTime());
});

test('resume SLA persists the paused working minutes into both due dates', async () => {
  const { prisma, ticket, events } = makePrisma();
  const pausedAt = new Date(2026, 10, 16, 10, 0);
  const resumedAt = new Date(2026, 10, 16, 11, 0);
  await service.pauseSla(prisma, 51, 7, 'Waiting for customer', pausedAt);
  await service.resumeSla(prisma, 51, 7, 'Customer replied', resumedAt);

  assert.equal(ticket.firstResponseDueAt.getTime(), new Date(2026, 10, 16, 16, 0).getTime());
  assert.equal(ticket.resolveDueAt.getTime(), new Date(2026, 10, 16, 18, 0).getTime());
  assert.equal(events.at(-1).eventType, 'SLA_RESUMED');
  assert.equal(events.at(-1).payload.pausedWorkingMinutes, 60);

  const details = await service.getSlaDetails(prisma, 51, { id: 7, accessType: 'STAFF' }, resumedAt);
  assert.equal(details.isPaused, false);
  assert.equal(details.firstResponse.dueAt.getTime(), ticket.firstResponseDueAt.getTime());
});

test('pause rejects a second active pause and resume rejects an unpaused ticket', async () => {
  const { prisma } = makePrisma();
  const pausedAt = new Date(2026, 10, 16, 10, 0);
  await service.pauseSla(prisma, 51, 7, 'Waiting', pausedAt);
  await assert.rejects(
    () => service.pauseSla(prisma, 51, 7, 'Duplicate pause', new Date(2026, 10, 16, 10, 30)),
    (error) => error.code === 'SUPPORT_SLA_ALREADY_PAUSED' && error.statusCode === 409,
  );

  const fresh = makePrisma();
  await assert.rejects(
    () => service.resumeSla(fresh.prisma, 51, 7, 'No active pause', new Date(2026, 10, 16, 11, 0)),
    (error) => error.code === 'SUPPORT_SLA_NOT_PAUSED' && error.statusCode === 409,
  );
});


test('SLA working hours use the configured IANA timezone, not the host timezone', () => {
  const tehranCalendar = { ...calendar, timezone: 'Asia/Tehran' };
  const start = new Date('2026-11-16T05:00:00.000Z'); // Monday 08:30 in Tehran
  const end = new Date('2026-11-16T08:00:00.000Z'); // Monday 11:30 in Tehran

  assert.equal(service.isWorkingDay(start, tehranCalendar), true);
  assert.equal(service.calculateWorkingMinutesBetween(start, end, tehranCalendar), 150);
  assert.equal(
    service.addWorkingMinutes(start, 120, tehranCalendar).toISOString(),
    '2026-11-16T07:30:00.000Z', // Monday 11:00 in Tehran
  );
});

test('SLA holidays are interpreted as dates in the configured timezone', () => {
  const holidayCalendar = {
    ...calendar,
    timezone: 'Asia/Tehran',
    holidays: ['2026-11-16'],
  };
  const monday = new Date('2026-11-16T05:00:00.000Z');

  assert.equal(service.isWorkingDay(monday, holidayCalendar), false);
  assert.equal(
    service.addWorkingMinutes(monday, 60, holidayCalendar).toISOString(),
    '2026-11-17T06:30:00.000Z', // Tuesday 10:00 in Tehran
  );
});


test('invalid persisted SLA timezone or working hours fall back to the safe default calendar', () => {
  const invalidTimezone = service.parseWorkingCalendar({ ...calendar, timezone: 'Not/A_Timezone' });
  const invalidHours = service.parseWorkingCalendar({ ...calendar, workStartHour: 19, workEndHour: 9 });

  assert.equal(invalidTimezone.timezone, 'Asia/Tehran');
  assert.equal(invalidHours.timezone, 'Asia/Tehran');
  assert.equal(invalidHours.workStartHour, 9);
  assert.equal(invalidHours.workEndHour, 18);
});
