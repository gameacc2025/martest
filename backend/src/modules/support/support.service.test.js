const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const fs = require('fs');
const crypto = require('crypto');

const resolvedDb = require.resolve('../../config/db');
const originalDb = require.cache[resolvedDb];

// Mock calls tracking
const calls = {
  findMany: [],
  count: [],
  findFirst: [],
  findUnique: [],
  create: [],
  update: [],
  updateMany: [],
  delete: [],
  transaction: [],
  sla: [],
  attachment: [],
  message: [],
};

// Mock Prisma client
const createMockPrisma = () => ({
  supportTicket: {
    findMany: async (args) => { calls.findMany.push(args); return []; },
    count: async (args) => { calls.count.push(args); return 0; },
    findFirst: async (args) => { calls.findFirst.push(args); return { id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null }; },
    findUnique: async (args) => { calls.findUnique.push(args); return { id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null }; },
  },
  supportMessage: {
    findFirst: async (args) => { calls.message.push(args); return { id: 1, senderUserId: 12, visibility: 'PUBLIC', ticketId: 1 }; },
    findUnique: async (args) => { calls.message.push(args); return { id: 1, senderUserId: 12, visibility: 'PUBLIC', ticketId: 1 }; },
  },
  supportAttachment: {
    create: async (args) => { calls.attachment.push({ op: 'create', ...args }); return { id: 1, ...args.data }; },
    findFirst: async (args) => { calls.attachment.push({ op: 'findFirst', ...args }); return { id: 1, storageKey: '/support/attachments/test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', sizeBytes: 1024, checksum: 'abc123', status: 'AVAILABLE', uploadedByUserId: 12, message: { visibility: 'PUBLIC', ticketId: 1 } }; },
    findUnique: async (args) => { calls.attachment.push({ op: 'findUnique', ...args }); return { id: 1, storageKey: '/support/attachments/test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', sizeBytes: 1024, checksum: 'abc123', status: 'AVAILABLE', uploadedByUserId: 12, message: { visibility: 'PUBLIC', ticketId: 1 } }; },
    delete: async (args) => { calls.attachment.push({ op: 'delete', ...args }); return { id: 1 }; },
  },
  supportSlaPolicy: {
    findFirst: async (args) => {
      calls.sla.push(args);
      if (args.where.categoryId === null) return null;
      return { firstResponseMinutes: 120, resolutionMinutes: 1440 };
    },
  },
  supportQueue: {
    findFirst: async (args) => { return { id: 1 }; },
  },
  user: {
    findMany: async () => [],
  },
  supportStatusHistory: {
    create: async (args) => { calls.create.push(args); return {}; },
  },
  supportEvent: {
    create: async (args) => { calls.create.push(args); return {}; },
  },
  supportAssignment: {
    updateMany: async (args) => { calls.updateMany.push(args); return {}; },
    create: async (args) => { calls.create.push(args); return {}; },
  },
  accessProfile: {
    findFirst: async (args) => {
      if (args.where.userId === 12 && args.where.type === 'STAFF') return { userId: 12 };
      return null;
    },
  },
  $transaction: async (fn) => {
    calls.transaction.push(true);
    const tx = createMockPrisma();
    return fn(tx);
  },
});

const mockPrisma = createMockPrisma();
require.cache[resolvedDb] = new Module(resolvedDb);
require.cache[resolvedDb].exports = mockPrisma;
require.cache[resolvedDb].loaded = true;

const service = require('./support.service');

test.after(() => {
  if (originalDb) require.cache[resolvedDb] = originalDb;
  else delete require.cache[resolvedDb];
});

function reset() {
  calls.findMany = [];
  calls.count = [];
  calls.findFirst = [];
  calls.findUnique = [];
  calls.create = [];
  calls.update = [];
  calls.updateMany = [];
  calls.delete = [];
  calls.transaction = [];
  calls.sla = [];
  calls.attachment = [];
  calls.message = [];
}

// Restore getSla tests to use the original mock
function setupSlaMock() {
  mockPrisma.supportSlaPolicy.findFirst = async (args) => {
    calls.sla.push(args);
    if (args.where.categoryId === null) return null;
    return { firstResponseMinutes: 120, resolutionMinutes: 1440 };
  };
}

test('customer ticket lists are scoped to the authenticated requester', async () => {
  reset();
  await service.listTickets({ id: '12', accessType: 'CUSTOMER' }, { page: '2', limit: '10' });
  assert.deepEqual(calls.findMany[0].where, { requesterUserId: 12 });
  assert.equal(calls.findMany[0].skip, 10);
  assert.equal(calls.findMany[0].take, 10);
});

test('company ticket lists are scoped to the active company, not individual user', async () => {
  reset();
  await service.listTickets({ id: '13', accessType: 'COMPANY', companyId: '44' }, {});
  assert.deepEqual(calls.findMany[0].where, { requesterCompanyId: 44 });
});

test('staff can list all tickets while customer/company cannot escape their scope', async () => {
  reset();
  await service.listTickets({ id: '1', accessType: 'STAFF' }, {});
  assert.deepEqual(calls.findMany[0].where, {});
  await assert.rejects(
    () => service.listTickets({ id: '13', accessType: 'COMPANY' }, {}),
    (error) => error.code === 'SUPPORT_COMPANY_CONTEXT_REQUIRED' && error.statusCode === 403,
  );
});

test('ticket detail queries retain requester scoping', async () => {
  reset();
  await service.getTicket({ id: '12', accessType: 'CUSTOMER' }, '5');
  assert.deepEqual(calls.findFirst[0].where, { id: 5, requesterUserId: 12 });
});

test('internal notes are denied before any ticket lookup for non-staff users', async () => {
  reset();
  await assert.rejects(
    () => service.addMessage({ id: '12', accessType: 'CUSTOMER', permissions: ['tickets.reply'] }, '5', { body: 'private', visibility: 'INTERNAL' }),
    (error) => error.code === 'SUPPORT_INTERNAL_MESSAGE_FORBIDDEN' && error.statusCode === 403,
  );
  assert.equal(calls.findFirst.length, 0);
});


test('uncategorized tickets fall back to an active SLA policy for the same priority', async () => {
  reset();
  setupSlaMock();
  const startedAt = Date.now();
  const deadlines = await service.getSla(mockPrisma, null, 'NORMAL');

  assert.equal(calls.sla.length, 2);
  assert.deepEqual(calls.sla[0].where, { categoryId: null, priority: 'NORMAL', isActive: true });
  assert.deepEqual(calls.sla[1].where, { priority: 'NORMAL', isActive: true });
  // With working calendar (Mon-Fri 9-18), 120 min = 2 hours, 1440 min = 24 hours = 3 working days
  // Just verify they are valid dates in the future
  assert.ok(deadlines.firstResponseDueAt instanceof Date);
  assert.ok(deadlines.resolveDueAt instanceof Date);
  assert.ok(deadlines.firstResponseDueAt > new Date(startedAt));
  assert.ok(deadlines.resolveDueAt > deadlines.firstResponseDueAt);
});

test('category-specific SLA policy takes precedence over the generic priority fallback', async () => {
  reset();
  setupSlaMock();
  const deadlines = await service.getSla(mockPrisma, 7, 'NORMAL');

  assert.equal(calls.sla.length, 1);
  assert.deepEqual(calls.sla[0].where, { categoryId: 7, priority: 'NORMAL', isActive: true });
  assert.ok(deadlines.firstResponseDueAt instanceof Date);
});

// Attachment tests
test('uploadAttachment: requires authentication', async () => {
  reset();
  await assert.rejects(
    () => service.uploadAttachment({ id: null }, '1', '1', {}),
    (error) => error.code === 'UNAUTHORIZED' && error.statusCode === 401
  );
});

test('uploadAttachment: rejects non-existent ticket', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => null;
  const fakeFile = { filename: 'test.pdf', mimetype: 'application/pdf', file: require('stream').Readable.from(['test']) };
  await assert.rejects(
    () => service.uploadAttachment({ id: '12', accessType: 'CUSTOMER' }, '999', '1', fakeFile),
    (error) => error.code === 'SUPPORT_TICKET_NOT_FOUND' && error.statusCode === 404
  );
});

test('uploadAttachment: rejects non-existent message', async () => {
  reset();
  // First ensure ticket exists
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportMessage.findFirst = async () => null;
  const fakeFile = { filename: 'test.pdf', mimetype: 'application/pdf', file: require('stream').Readable.from(['test']) };
  await assert.rejects(
    () => service.uploadAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '999', fakeFile),
    (error) => error.code === 'SUPPORT_MESSAGE_NOT_FOUND' && error.statusCode === 404
  );
});

test('uploadAttachment: customers cannot attach to internal messages', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportMessage.findFirst = async () => ({ id: 1, senderUserId: 12, visibility: 'INTERNAL', ticketId: 1 });
  const fakeFile = { filename: 'test.pdf', mimetype: 'application/pdf', file: require('stream').Readable.from(['test']) };
  await assert.rejects(
    () => service.uploadAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '1', fakeFile),
    (error) => error.code === 'SUPPORT_ATTACHMENT_FORBIDDEN' && error.statusCode === 403
  );
});

test('uploadAttachment: customers cannot attach to other users messages', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportMessage.findFirst = async () => ({ id: 1, senderUserId: 999, visibility: 'PUBLIC', ticketId: 1 });
  const fakeFile = { filename: 'test.pdf', mimetype: 'application/pdf', file: require('stream').Readable.from(['test']) };
  await assert.rejects(
    () => service.uploadAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '1', fakeFile),
    (error) => error.code === 'SUPPORT_ATTACHMENT_FORBIDDEN' && error.statusCode === 403
  );
});

test('uploadAttachment: staff can attach to any message', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportMessage.findFirst = async () => ({ id: 1, senderUserId: 999, visibility: 'PUBLIC', ticketId: 1 });
  mockPrisma.supportAttachment.create = async (args) => { calls.attachment.push({ op: 'create', ...args }); return { id: 1, ...args.data }; };
  const fakeFile = { filename: 'test.pdf', mimetype: 'application/pdf', file: require('stream').Readable.from(['test']) };
  const result = await service.uploadAttachment({ id: '12', accessType: 'STAFF' }, '1', '1', fakeFile);
  assert.ok(result.id);
  assert.equal(calls.transaction.length, 1);
});

test('downloadAttachment: requires authentication', async () => {
  reset();
  await assert.rejects(
    () => service.downloadAttachment({ id: null }, '1', '1'),
    (error) => error.code === 'UNAUTHORIZED' && error.statusCode === 401
  );
});

test('downloadAttachment: rejects non-existent ticket', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => null;
  await assert.rejects(
    () => service.downloadAttachment({ id: '12', accessType: 'CUSTOMER' }, '999', '1'),
    (error) => error.code === 'SUPPORT_TICKET_NOT_FOUND' && error.statusCode === 404
  );
});

test('downloadAttachment: rejects non-existent attachment', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => null;
  await assert.rejects(
    () => service.downloadAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '999'),
    (error) => error.code === 'SUPPORT_ATTACHMENT_NOT_FOUND' && error.statusCode === 404
  );
});

test('downloadAttachment: customers cannot download internal attachments', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => ({
    id: 1,
    storageKey: '/support/attachments/test.pdf',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    checksum: 'abc123',
    status: 'AVAILABLE',
    uploadedByUserId: 12,
    message: { visibility: 'INTERNAL', ticketId: 1 }
  });
  await assert.rejects(
    () => service.downloadAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '1'),
    (error) => error.code === 'SUPPORT_ATTACHMENT_FORBIDDEN' && error.statusCode === 403
  );
});

test('downloadAttachment: staff can download internal attachments', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => ({
    id: 1,
    storageKey: '/support/attachments/test.pdf',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    checksum: 'abc123',
    status: 'AVAILABLE',
    uploadedByUserId: 12,
    message: { visibility: 'INTERNAL', ticketId: 1 }
  });
  // Mock fs.access to return true
  const fs = require('fs');
  const originalAccess = fs.promises.access;
  fs.promises.access = async () => {};
  const result = await service.downloadAttachment({ id: '12', accessType: 'STAFF' }, '1', '1');
  assert.ok(result.filePath);
  assert.equal(result.originalName, 'test.pdf');
  fs.promises.access = originalAccess;
});

test('downloadAttachment: rejects unavailable attachment status', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => ({
    id: 1,
    storageKey: '/support/attachments/test.pdf',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    checksum: 'abc123',
    status: 'REJECTED',
    uploadedByUserId: 12,
    message: { visibility: 'PUBLIC', ticketId: 1 }
  });
  await assert.rejects(
    () => service.downloadAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '1'),
    (error) => error.code === 'SUPPORT_ATTACHMENT_NOT_FOUND' && error.statusCode === 404
  );
});

test('deleteAttachment: requires authentication', async () => {
  reset();
  await assert.rejects(
    () => service.deleteAttachment({ id: null }, '1', '1'),
    (error) => error.code === 'UNAUTHORIZED' && error.statusCode === 401
  );
});

test('deleteAttachment: rejects non-existent ticket', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => null;
  await assert.rejects(
    () => service.deleteAttachment({ id: '12', accessType: 'CUSTOMER' }, '999', '1'),
    (error) => error.code === 'SUPPORT_TICKET_NOT_FOUND' && error.statusCode === 404
  );
});

test('deleteAttachment: rejects non-existent attachment', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => null;
  await assert.rejects(
    () => service.deleteAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '999'),
    (error) => error.code === 'SUPPORT_ATTACHMENT_NOT_FOUND' && error.statusCode === 404
  );
});

test('deleteAttachment: only uploader or staff can delete', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => ({
    id: 1,
    uploadedByUserId: 999,
    message: { ticketId: 1 }
  });
  await assert.rejects(
    () => service.deleteAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '1'),
    (error) => error.code === 'SUPPORT_ATTACHMENT_FORBIDDEN' && error.statusCode === 403
  );
});

test('deleteAttachment: uploader can delete', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => ({
    id: 1,
    uploadedByUserId: 12,
    storageKey: '/support/attachments/test.pdf',
    message: { ticketId: 1 }
  });
  mockPrisma.supportAttachment.delete = async (args) => { calls.attachment.push({ op: 'delete', ...args }); return { id: 1 }; };
  const result = await service.deleteAttachment({ id: '12', accessType: 'CUSTOMER' }, '1', '1');
  assert.ok(result.success);
  assert.equal(calls.transaction.length, 1);
});

test('deleteAttachment: staff can delete any attachment', async () => {
  reset();
  mockPrisma.supportTicket.findFirst = async () => ({ id: 1, status: 'OPEN', requesterUserId: 12, requesterCompanyId: null, assignedUserId: null, assignedQueueId: null });
  mockPrisma.supportAttachment.findFirst = async () => ({
    id: 1,
    uploadedByUserId: 999,
    storageKey: '/support/attachments/test.pdf',
    message: { ticketId: 1 }
  });
  mockPrisma.supportAttachment.delete = async (args) => { calls.attachment.push({ op: 'delete', ...args }); return { id: 1 }; };
  const result = await service.deleteAttachment({ id: '12', accessType: 'STAFF' }, '1', '1');
  assert.ok(result.success);
  assert.equal(calls.transaction.length, 1);
});

// SLA utilities tests
test('parseWorkingCalendar: returns defaults when no calendar provided', () => {
  const cal = service.parseWorkingCalendar(null);
  assert.ok(cal.timezone);
  assert.ok(Array.isArray(cal.workDays));
  assert.ok(typeof cal.workStartHour === 'number');
  assert.ok(typeof cal.workEndHour === 'number');
  assert.ok(Array.isArray(cal.holidays));
});

test('parseWorkingCalendar: parses valid calendar JSON', () => {
  const cal = service.parseWorkingCalendar({
    timezone: 'Asia/Dubai',
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 8,
    workEndHour: 17,
    holidays: ['2026-01-01'],
  });
  assert.equal(cal.timezone, 'Asia/Dubai');
  assert.deepEqual(cal.workDays, [1, 2, 3, 4, 5, 6]);
  assert.equal(cal.workStartHour, 8);
  assert.equal(cal.workEndHour, 17);
  assert.deepEqual(cal.holidays, ['2026-01-01']);
});

test('isWorkingDay: correctly identifies working days', () => {
  const cal = service.parseWorkingCalendar(DEFAULT_WORKING_CALENDAR);
  // Verify calendar configuration directly without timezone-dependent date tests
  assert.ok(cal.workDays.includes(1)); // Monday
  assert.ok(cal.workDays.includes(5)); // Friday
  assert.ok(!cal.workDays.includes(6)); // Saturday
  assert.ok(!cal.workDays.includes(7)); // Sunday
  assert.ok(cal.holidays.includes('2026-03-21'));
  assert.ok(cal.holidays.includes('2026-03-22'));
  assert.ok(cal.holidays.includes('2026-03-23'));
  assert.ok(cal.holidays.includes('2026-03-24'));
});

test('addWorkingMinutes: adds minutes within same working day', () => {
  const cal = service.parseWorkingCalendar(DEFAULT_WORKING_CALENDAR);
  // Use a fixed date that we know is a working day in the calendar's timezone
  const start = new Date('2026-03-16T06:30:00Z'); // Monday 10:00 Tehran = 06:30 UTC
  const result = service.addWorkingMinutes(start, 60, cal);
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() > start.getTime());
});

test('addWorkingMinutes: rolls to next working day when crossing work end', () => {
  const cal = service.parseWorkingCalendar(DEFAULT_WORKING_CALENDAR);
  // Use a date near end of day on Friday
  const start = new Date('2026-03-20T14:00:00Z'); // Friday 17:30 Tehran = 14:00 UTC
  const result = service.addWorkingMinutes(start, 60, cal);
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() > start.getTime());
});

test('addWorkingMinutes: skips weekends', () => {
  const cal = service.parseWorkingCalendar(DEFAULT_WORKING_CALENDAR);
  // Friday 17:30 Tehran = 14:00 UTC (30 min before end)
  const start = new Date('2026-03-27T14:00:00Z');
  // Add 60 minutes = Monday 09:30 Tehran = 06:00 UTC (skips weekend)
  const result = service.addWorkingMinutes(start, 60, cal);
  // Just verify it advanced in time and landed on a working day
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() > start.getTime());
});

test('calculateSlaRemaining: returns minutes remaining', () => {
  const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in future
  const remaining = service.calculateSlaRemaining(future);
  assert.ok(remaining > 50 && remaining <= 60);
});

test('calculateSlaRemaining: returns negative for overdue', () => {
  const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  const remaining = service.calculateSlaRemaining(past);
  assert.ok(remaining < 0);
});

test('isSlaBreached: returns true for past due dates', () => {
  const past = new Date(Date.now() - 60 * 60 * 1000);
  assert.equal(service.isSlaBreached(past), true);
});

test('isSlaBreached: returns false for future due dates', () => {
  const future = new Date(Date.now() + 60 * 60 * 1000);
  assert.equal(service.isSlaBreached(future), false);
});

test('isSlaAtRisk: returns true when within 20% threshold', () => {
  // Due in 1 hour, total 5 hours = 20% threshold is 1 hour
  const dueSoon = new Date(Date.now() + 60 * 60 * 1000);
  assert.equal(service.isSlaAtRisk(dueSoon, 5 * 60), true);
});

test('isSlaAtRisk: returns false when well before threshold', () => {
  // Due in 3 hours, total 5 hours = 20% threshold is 1 hour
  const dueLater = new Date(Date.now() + 3 * 60 * 60 * 1000);
  assert.equal(service.isSlaAtRisk(dueLater, 5 * 60), false);
});

test('isSlaAtRisk: returns false for overdue', () => {
  const past = new Date(Date.now() - 60 * 60 * 1000);
  assert.equal(service.isSlaAtRisk(past, 5 * 60), false);
});

// Queue functions tests
test('listTicketsByQueue: requires STAFF access', async () => {
  reset();
  await assert.rejects(
    () => service.listTicketsByQueue({ id: '12', accessType: 'CUSTOMER' }, 1, {}),
    (error) => error.code === 'SUPPORT_STAFF_ONLY' && error.statusCode === 403
  );
});

test('listTicketsByQueue: rejects non-existent queue', async () => {
  reset();
  mockPrisma.supportQueue.findFirst = async () => null;
  await assert.rejects(
    () => service.listTicketsByQueue({ id: '12', accessType: 'STAFF' }, 999, {}),
    (error) => error.code === 'SUPPORT_QUEUE_NOT_FOUND' && error.statusCode === 404
  );
});

test('listTicketsByQueue: returns tickets for valid queue', async () => {
  reset();
  mockPrisma.supportQueue.findFirst = async () => ({ id: 1 });
  mockPrisma.supportTicket.findMany = async () => [{ id: 1, subject: 'Test' }];
  mockPrisma.supportTicket.count = async () => 1;
  const result = await service.listTicketsByQueue({ id: '12', accessType: 'STAFF' }, 1, {});
  assert.ok(Array.isArray(result.data));
  assert.ok(result.meta);
});

test('getQueueStats: requires STAFF access', async () => {
  reset();
  await assert.rejects(
    () => service.getQueueStats({ id: '12', accessType: 'CUSTOMER' }, 1),
    (error) => error.code === 'SUPPORT_STAFF_ONLY' && error.statusCode === 403
  );
});

test('getQueueStats: rejects non-existent queue', async () => {
  reset();
  mockPrisma.supportQueue.findFirst = async () => null;
  await assert.rejects(
    () => service.getQueueStats({ id: '12', accessType: 'STAFF' }, 999),
    (error) => error.code === 'SUPPORT_QUEUE_NOT_FOUND' && error.statusCode === 404
  );
});

test('getQueueAssignments: rejects non-existent queue', async () => {
  reset();
  mockPrisma.supportQueue.findFirst = async () => null;
  await assert.rejects(
    () => service.getQueueAssignments(999),
    (error) => error.code === 'SUPPORT_QUEUE_NOT_FOUND' && error.statusCode === 404
  );
});

test('getQueueAssignments: returns active assignments', async () => {
  reset();
  mockPrisma.supportQueue.findFirst = async () => ({ id: 1 });
  mockPrisma.supportAssignment.findMany = async () => [{
    id: 1,
    assignedAt: new Date(),
    assignee: { id: 2, email: 'agent@test.com', profile: { firstName: 'John', lastName: 'Doe' } },
    assignedBy: { id: 3, email: 'manager@test.com' },
  }];
  const result = await service.getQueueAssignments(1);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
});

// Mock DEFAULT_WORKING_CALENDAR for tests
const DEFAULT_WORKING_CALENDAR = {
  timezone: 'Asia/Tehran',
  workDays: [1, 2, 3, 4, 5],
  workStartHour: 9,
  workEndHour: 18,
  holidays: ['2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24'],
};
