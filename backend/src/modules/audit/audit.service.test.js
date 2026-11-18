// =============================================================
// Unit tests — Audit Log service
//
// Run with:  node --test
//
// Mocks:
//   - config/db -> mockPrisma
// =============================================================

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
  return resolved;
}

// ── Mock Prisma client ───────────────────────────────────────
const calls = {
  auditLogCount: [],
  auditLogFindMany: [],
  auditLogGroupBy: [],
  auditLogFindUnique: [],
  auditLogCreate: [],
};

let fx;

function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    logs: [
      {
        id: 1,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: '10',  // String in DB
        actorUserId: 10,  // DB field name
        actor: { email: 'test@example.com', phone: '09120000000' },
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla',
        severity: 'INFO',
        metadata: { foo: 'bar' },
        occurredAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: 2,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: '10',
        actorUserId: 10,
        actor: { email: 'test@example.com', phone: '09120000000' },
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla',
        severity: 'INFO',
        metadata: null,
        occurredAt: new Date('2024-01-15T11:00:00Z')
      },
    ],
  };
}
resetMocks();

const mockPrisma = {
  auditLog: {
    count: async (args) => {
      calls.auditLogCount.push(args);
      return fx.logs.length;
    },
    findMany: async (args) => {
      calls.auditLogFindMany.push(args);
      // Simple filter implementation for tests
      let filtered = fx.logs;
      if (args.where) {
        if (args.where.action) filtered = filtered.filter(l => l.action === args.where.action.equals);
        if (args.where.entityType) filtered = filtered.filter(l => l.entityType === args.where.entityType.equals);
        if (args.where.entityId) filtered = filtered.filter(l => l.entityId === args.where.entityId);
        if (args.where.actorUserId) filtered = filtered.filter(l => l.actorUserId === args.where.actorUserId);
        if (args.where.ipAddress) filtered = filtered.filter(l => l.ipAddress.includes(args.where.ipAddress.contains));
        if (args.where.severity) filtered = filtered.filter(l => l.severity === args.where.severity.equals);
        if (args.where.occurredAt) {
          if (args.where.occurredAt.gte) filtered = filtered.filter(l => l.occurredAt >= args.where.occurredAt.gte);
          if (args.where.occurredAt.lt) filtered = filtered.filter(l => l.occurredAt < args.where.occurredAt.lt);
        }
      }
      if (args.skip) filtered = filtered.slice(args.skip);
      if (args.take) filtered = filtered.slice(0, args.take);
      if (args.orderBy) {
        const [field, order] = Object.entries(args.orderBy)[0];
        filtered.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return order === 'asc' ? -1 : 1;
          if (valA > valB) return order === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return filtered.map(l => ({ ...l }));
    },
    groupBy: async (args) => {
      calls.auditLogGroupBy.push(args);
      // Simplified grouping for tests
      if (args.by[0] === 'severity') {
        return [
          { severity: 'INFO', _count: { severity: 2 } },
          { severity: 'WARN', _count: { severity: 1 } },
        ];
      }
      if (args.by[0] === 'action') {
        return [
          { action: 'USER_LOGIN', _count: { action: 1 } },
          { action: 'USER_LOGOUT', _count: { action: 1 } },
        ];
      }
      if (args.by[0] === 'entityType') {
        return [
          { entityType: 'User', _count: { entityType: 2 } },
        ];
      }
      return [];
    },
    findUnique: async (args) => {
      calls.auditLogFindUnique.push(args);
      if (args.where.id !== undefined) {
        return fx.logs.find(l => l.id === args.where.id) || null;
      }
      return null;
    },
    create: async (args) => {
      calls.auditLogCreate.push(args);
      return { id: 99, ...args.data };
    },
  },
};

injectMock('../../config/db', mockPrisma);

// Now load the real service
const service = require('./audit.service');

function baseResetAll() {
  resetMocks();
}

// ── searchAuditLogs ──────────────────────────────────────────

test('searchAuditLogs: returns paginated results', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ page: 1, pageSize: 10 });
  assert.equal(result.data.length, 2);
  assert.equal(result.meta.total, 2);
  assert.equal(result.meta.page, 1);
  assert.equal(result.meta.pageSize, 10);
  assert.equal(result.meta.totalPages, 1);
});

test('searchAuditLogs: filters by action', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { action: 'USER_LOGIN' } });
  assert.equal(calls.auditLogFindMany[0].where.action.equals, 'USER_LOGIN');
});

test('searchAuditLogs: filters by entityType', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { entityType: 'User' } });
  assert.equal(calls.auditLogFindMany[0].where.entityType.equals, 'User');
});

test('searchAuditLogs: filters by entityId', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { entityId: 10 } });
  assert.equal(calls.auditLogFindMany[0].where.entityId, '10'); // String in DB
});

test('searchAuditLogs: filters by userId', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { userId: 10 } });
  assert.equal(calls.auditLogFindMany[0].where.actorUserId, 10); // DB field is actorUserId
});

test('searchAuditLogs: filters by ipAddress', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { ipAddress: '1.2' } });
  assert.equal(calls.auditLogFindMany[0].where.ipAddress.contains, '1.2');
});

test('searchAuditLogs: filters by severity', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { severity: 'ERROR' } });
  assert.equal(calls.auditLogFindMany[0].where.severity.equals, 'ERROR');
});

test('searchAuditLogs: filters by date range', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ filters: { dateFrom: '2024-01-01', dateTo: '2024-01-31' } });
  assert.ok(calls.auditLogFindMany[0].where.occurredAt.gte instanceof Date);
  assert.ok(calls.auditLogFindMany[0].where.occurredAt.lt instanceof Date);
});

test('searchAuditLogs: validates page and pageSize bounds', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ page: 0, pageSize: 1000 });
  assert.equal(result.meta.page, 1);
  assert.equal(result.meta.pageSize, 500); // MAX_PAGE_SIZE
});

test('searchAuditLogs: validates sort field', async () => {
  baseResetAll();
  const result = await service.searchAuditLogs({ sortBy: 'invalid', sortOrder: 'invalid' });
  // Should default to occurredAt desc
  assert.equal(calls.auditLogFindMany[0].orderBy.occurredAt, 'desc');
});

// ── getAuditStats ────────────────────────────────────────────

test('getAuditStats: returns aggregated statistics', async () => {
  baseResetAll();
  const stats = await service.getAuditStats({});
  assert.ok(typeof stats.total === 'number');
  assert.ok(typeof stats.bySeverity === 'object');
  assert.ok(Array.isArray(stats.topActions));
  assert.ok(Array.isArray(stats.topEntityTypes));
  assert.ok(Array.isArray(stats.recentErrors));
});

test('getAuditStats: filters by date range', async () => {
  baseResetAll();
  await service.getAuditStats({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });
  assert.ok(calls.auditLogCount[0].where.occurredAt.gte instanceof Date);
  assert.ok(calls.auditLogCount[0].where.occurredAt.lt instanceof Date);
});

// ── getAuditLogById ──────────────────────────────────────────

test('getAuditLogById: returns log entry', async () => {
  baseResetAll();
  const log = await service.getAuditLogById(1);
  assert.ok(log);
  assert.equal(log.id, 1);
  assert.equal(log.action, 'USER_LOGIN');
});

test('getAuditLogById: returns null for non-existent', async () => {
  baseResetAll();
  const log = await service.getAuditLogById(999);
  assert.equal(log, null);
});

// ── exportAuditLogs ──────────────────────────────────────────

test('exportAuditLogs: returns all matching logs up to limit', async () => {
  baseResetAll();
  const logs = await service.exportAuditLogs({});
  assert.equal(logs.length, 2);
  assert.ok(logs[0].id);
  assert.ok(logs[0].createdAt); // Transformed to createdAt in response
});

test('exportAuditLogs: applies filters', async () => {
  baseResetAll();
  await service.exportAuditLogs({ filters: { severity: 'ERROR' } });
  assert.equal(calls.auditLogFindMany[0].where.severity.equals, 'ERROR');
});

test('exportAuditLogs: respects EXPORT_MAX_ROWS limit', async () => {
  baseResetAll();
  const logs = await service.exportAuditLogs({});
  assert.ok(logs.length <= 50000); // EXPORT_MAX_ROWS
});

test('redactSensitiveData is case-insensitive for sensitive keys at every nesting level', () => {
  const input = {
    apiKey: 'api-secret',
    APIKEY: 'upper-secret',
    privateKey: 'private-secret',
    creditCard: 'card-secret',
    cardNumber: 'number-secret',
    nationalId: 'national-secret',
    bankAccount: 'bank-secret',
    nested: [{ refreshToken: 'refresh-secret', safeLabel: 'visible' }],
  };
  const result = service.redactSensitiveData(input);
  for (const key of ['apiKey', 'APIKEY', 'privateKey', 'creditCard', 'cardNumber', 'nationalId', 'bankAccount']) {
    assert.equal(result[key], '[REDACTED]', key);
  }
  assert.equal(result.nested[0].refreshToken, '[REDACTED]');
  assert.equal(result.nested[0].safeLabel, 'visible');
});


test('recordAuditLogExplicit uses the central writer and redacts nested metadata', async () => {
  baseResetAll();
  const log = await service.recordAuditLogExplicit({
    actorUserId: 12,
    actorAccessType: 'STAFF',
    action: 'CRM_LEAD_MERGED',
    entityType: 'Lead',
    entityId: 42,
    source: 'ADMIN',
    requestId: 'req-audit-42',
    before: { apiKey: 'before-secret', label: 'visible' },
    after: { Password: 'after-secret' },
    metadata: { nested: { privateKey: 'nested-secret' } },
  });

  assert.equal(calls.auditLogCreate.length, 1);
  const data = calls.auditLogCreate[0].data;
  assert.equal(data.requestId, 'req-audit-42');
  assert.equal(data.metadata.before.apiKey, '[REDACTED]');
  assert.equal(data.metadata.before.label, 'visible');
  assert.equal(data.metadata.after.Password, '[REDACTED]');
  assert.equal(data.metadata.extra.nested.privateKey, '[REDACTED]');
  assert.equal(log.action, 'CRM_LEAD_MERGED');
});

test('recordAuditLogExplicit writes through the supplied transaction client', async () => {
  baseResetAll();
  let transactionArgs;
  const tx = {
    auditLog: {
      create: async (args) => {
        transactionArgs = args;
        return { id: 123, ...args.data };
      },
    },
  };

  const log = await service.recordAuditLogExplicit({
    tx,
    actorUserId: 13,
    actorAccessType: 'STAFF',
    action: 'CRM_LEAD_MERGED',
    entityType: 'Lead',
    entityId: 43,
    metadata: { apiSecret: 'secret' },
  });

  assert.equal(calls.auditLogCreate.length, 0);
  assert.equal(transactionArgs.data.actorUserId, 13);
  assert.equal(transactionArgs.data.metadata.extra.apiSecret, '[REDACTED]');
  assert.equal(log.id, 123);
});


test('recordAuditLog captures HTTP actor and request context through the central writer', async () => {
  baseResetAll();
  await service.recordAuditLog({
    request: {
      user: { id: 17, accessType: 'STAFF', companyId: null },
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        'user-agent': 'Audit-Test/1.0',
        'x-request-id': 'req-http-audit',
      },
      ip: '127.0.0.1',
    },
    action: 'CRM_LEAD_UPDATED',
    entityType: 'Lead',
    entityId: 77,
    metadata: { nested: { refreshToken: 'must-not-persist' } },
  });

  const data = calls.auditLogCreate[0].data;
  assert.equal(data.actorUserId, 17);
  assert.equal(data.actorAccessType, 'STAFF');
  assert.equal(data.ipAddress, '127.0.0.1'); // forwarding headers are untrusted unless Fastify trustProxy is configured
  assert.equal(data.userAgent, 'Audit-Test/1.0');
  assert.equal(data.requestId, 'req-http-audit');
  assert.equal(data.metadata.extra.nested.refreshToken, '[REDACTED]');
});


test('recordAuditLog derives its default source from COMPANY and CUSTOMER access context', async () => {
  for (const [accessType, expectedSource] of [
    ['COMPANY', 'COMPANY'],
    ['CUSTOMER', 'WEBSITE'],
  ]) {
    baseResetAll();
    await service.recordAuditLog({
      request: {
        user: { id: 27, accessType, companyId: accessType === 'COMPANY' ? 9 : null },
        headers: { 'user-agent': 'Audit-Source-Test/1.0' },
        ip: '127.0.0.1',
      },
      action: 'PROFILE_UPDATED',
      entityType: 'Profile',
      entityId: 27,
    });
    assert.equal(calls.auditLogCreate[0].data.source, expectedSource);
  }
});

test('getClientIp ignores untrusted forwarding headers and uses Fastify socket-derived IP', () => {
  assert.equal(
    service.getClientIp({
      headers: { 'x-forwarded-for': '198.51.100.10', 'x-real-ip': '203.0.113.5' },
      ip: '10.0.0.8',
      socket: { remoteAddress: '10.0.0.8' },
    }),
    '10.0.0.8',
  );
  assert.equal(
    service.getClientIp({ headers: { 'x-forwarded-for': '198.51.100.10' }, socket: { remoteAddress: '127.0.0.1' } }),
    '127.0.0.1',
  );
});


test('getCorrelationId rejects unbounded or unsafe request IDs', () => {
  const generated = service.getCorrelationId({
    headers: { 'x-request-id': 'x'.repeat(101) },
  });
  assert.match(generated, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(service.getCorrelationId({
    correlationId: 'safe:trace-42',
    headers: { 'x-request-id': 'unsafe value' },
  }), 'safe:trace-42');
});
