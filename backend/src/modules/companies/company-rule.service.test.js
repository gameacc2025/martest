// مسیر فایل: backend/src/modules/companies/company-rule.service.test.js
// =============================================================
// Unit tests — Company Rule service (per-company RFQ / RFQ-response
// quota enforcement used by the inquiries workflow).
//
// Run with:  node --test
//
// This is the quota engine that decides whether a company is allowed
// to open a new RFQ or submit a new response. It had ZERO coverage
// despite directly gating a core business workflow (silently letting
// a company blow past its plan limits, or wrongly blocking a company
// that's still within limits, are both real-money-shaped bugs).
//
// Mocks injected (same technique as category.service.test.js):
//   - config/db -> mockPrisma (records calls, returns fixtures)
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

const calls = {
  companyLimitFindMany: [],
  inquiryCount: [],
  inquiryResponseCount: [],
};

let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    configuredLimits: [], // rows returned by companyLimit.findMany
    inquiryCount: 0,
    inquiryResponseCount: 0,
  };
}
resetMocks();

const mockPrisma = {
  companyLimit: {
    findMany: async (args) => {
      calls.companyLimitFindMany.push(args);
      return fx.configuredLimits;
    },
  },
  inquiry: {
    count: async (args) => {
      calls.inquiryCount.push(args);
      return fx.inquiryCount;
    },
  },
  inquiryResponse: {
    count: async (args) => {
      calls.inquiryResponseCount.push(args);
      return fx.inquiryResponseCount;
    },
  },
};

injectMock('../../config/db', mockPrisma);

const {
  COMPANY_LIMIT_KEYS,
  evaluateCompanyLimits,
  validateInquiryCreationCapacity,
  validateResponseSubmissionCapacity,
} = require('./company-rule.service');

function limitRow(key, value) {
  return { key, value };
}

// ── companyId normalization ───────────────────────────────────

test('evaluateCompanyLimits: rejects a non-integer companyId', async () => {
  resetMocks();
  await assert.rejects(() => evaluateCompanyLimits('abc', [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'COMPANY_REQUIRED');
    return true;
  });
});

test('evaluateCompanyLimits: rejects companyId=0 and negative ids', async () => {
  resetMocks();
  await assert.rejects(() => evaluateCompanyLimits(0, []), (err) => {
    assert.equal(err.code, 'COMPANY_REQUIRED');
    return true;
  });
  await assert.rejects(() => evaluateCompanyLimits(-5, []), (err) => {
    assert.equal(err.code, 'COMPANY_REQUIRED');
    return true;
  });
});

test('evaluateCompanyLimits: accepts a numeric-string companyId (coerces to number)', async () => {
  resetMocks();
  await evaluateCompanyLimits('7', []);
  assert.equal(calls.companyLimitFindMany[0].where.companyId, 7);
});

// ── "no configured limit" = unlimited (opt-in quotas) ─────────

test('evaluateCompanyLimits: a key with no configured CompanyLimit row is skipped entirely (unlimited by default)', async () => {
  resetMocks();
  fx.configuredLimits = []; // nothing configured
  const result = await evaluateCompanyLimits(1, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]);

  assert.deepEqual(result, []);
  assert.equal(calls.inquiryCount.length, 0); // never even checks current usage
});

// ── unknown key guard ──────────────────────────────────────────

test('evaluateCompanyLimits: throws 500 UNKNOWN_COMPANY_LIMIT for a key with no RFQ_LIMIT_DEFINITIONS entry', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow('not.a.real.key', 5)];
  await assert.rejects(() => evaluateCompanyLimits(1, ['not.a.real.key']), (err) => {
    assert.equal(err.statusCode, 500);
    assert.equal(err.code, 'UNKNOWN_COMPANY_LIMIT');
    return true;
  });
});

// ── malformed limit value guard ────────────────────────────────

test('evaluateCompanyLimits: throws 500 INVALID_COMPANY_LIMIT for a negative configured value', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, -1)];
  await assert.rejects(() => evaluateCompanyLimits(1, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]), (err) => {
    assert.equal(err.statusCode, 500);
    assert.equal(err.code, 'INVALID_COMPANY_LIMIT');
    return true;
  });
});

test('evaluateCompanyLimits: throws 500 INVALID_COMPANY_LIMIT for a non-integer configured value', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, 2.5)];
  await assert.rejects(() => evaluateCompanyLimits(1, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]), (err) => {
    assert.equal(err.code, 'INVALID_COMPANY_LIMIT');
    return true;
  });
});

// ── the core quota decision: current >= max => blocked ─────────

test('evaluateCompanyLimits: MAX_OPEN_RFQS — under the cap passes and reports current/max', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, 5)];
  fx.inquiryCount = 4;

  const result = await evaluateCompanyLimits(1, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]);
  assert.deepEqual(result, [{ key: COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, current: 4, max: 5 }]);
});

test('evaluateCompanyLimits: MAX_OPEN_RFQS — at the cap (current === max) is blocked, not just over it', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, 5)];
  fx.inquiryCount = 5;

  await assert.rejects(() => evaluateCompanyLimits(1, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'MAX_OPEN_RFQS_EXCEEDED');
    assert.deepEqual(err.details, { key: COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, current: 5, max: 5 });
    assert.match(err.message, /5/);
    return true;
  });
});

test('evaluateCompanyLimits: MAX_OPEN_RFQS — counts only DRAFT/SUBMITTED/OPEN inquiries, scoped to the company', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, 5)];
  await evaluateCompanyLimits(9, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]);

  assert.deepEqual(calls.inquiryCount[0].where, {
    companyId: 9,
    status: { in: ['DRAFT', 'SUBMITTED', 'OPEN'] },
  });
});

test('evaluateCompanyLimits: MAX_ACTIVE_RFQ_RESPONSES — counts only PENDING responses', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES, 20)];
  await evaluateCompanyLimits(9, [COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES]);

  assert.deepEqual(calls.inquiryResponseCount[0].where, {
    companyId: 9,
    status: { in: ['PENDING'] },
  });
});

test('evaluateCompanyLimits: MAX_DAILY_RFQ_RESPONSES — counts responses createdAt >= today at local midnight', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES, 10)];
  await evaluateCompanyLimits(9, [COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES]);

  const gte = calls.inquiryResponseCount[0].where.createdAt.gte;
  assert.ok(gte instanceof Date);
  assert.equal(gte.getHours(), 0);
  assert.equal(gte.getMinutes(), 0);
  assert.equal(gte.getSeconds(), 0);
  assert.equal(gte.getDate(), new Date().getDate());
});

test('evaluateCompanyLimits: MAX_MONTHLY_RFQ_RESPONSES — counts responses createdAt >= the 1st of this month', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_MONTHLY_RFQ_RESPONSES, 50)];
  await evaluateCompanyLimits(9, [COMPANY_LIMIT_KEYS.MAX_MONTHLY_RFQ_RESPONSES]);

  const gte = calls.inquiryResponseCount[0].where.createdAt.gte;
  assert.equal(gte.getDate(), 1);
  assert.equal(gte.getHours(), 0);
});

test('evaluateCompanyLimits: only configured keys are checked — unconfigured keys among the requested set are silently skipped', async () => {
  resetMocks();
  fx.configuredLimits = [limitRow(COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES, 20)];
  fx.inquiryResponseCount = 1;

  const result = await evaluateCompanyLimits(9, [
    COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES,
    COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES,
    COMPANY_LIMIT_KEYS.MAX_MONTHLY_RFQ_RESPONSES,
  ]);

  assert.deepEqual(result, [{ key: COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES, current: 1, max: 20 }]);
});

test('evaluateCompanyLimits: fails fast — stops at the first breached limit and does not evaluate the rest', async () => {
  resetMocks();
  fx.configuredLimits = [
    limitRow(COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES, 1),
    limitRow(COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES, 10),
  ];
  fx.inquiryResponseCount = 1; // breaches MAX_ACTIVE_RFQ_RESPONSES (current >= max)

  await assert.rejects(
    () => evaluateCompanyLimits(9, [
      COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES,
      COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES,
    ]),
    (err) => {
      assert.equal(err.code, 'MAX_ACTIVE_RFQ_RESPONSES_EXCEEDED');
      return true;
    }
  );
  // Only the first key's count was ever queried.
  assert.equal(calls.inquiryResponseCount.length, 1);
});

// ── uses the passed-in transaction client, not the module-level prisma ─

test('evaluateCompanyLimits: reads/counts through the provided client (transaction-safe)', async () => {
  resetMocks();
  const txCalls = { findMany: [], count: [] };
  const txClient = {
    companyLimit: {
      findMany: async (args) => {
        txCalls.findMany.push(args);
        return [limitRow(COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS, 5)];
      },
    },
    inquiry: {
      count: async (args) => {
        txCalls.count.push(args);
        return 0;
      },
    },
  };

  await evaluateCompanyLimits(1, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS], txClient);

  assert.equal(txCalls.findMany.length, 1);
  assert.equal(txCalls.count.length, 1);
  // the module-level (non-tx) mock was never touched
  assert.equal(calls.companyLimitFindMany.length, 0);
  assert.equal(calls.inquiryCount.length, 0);
});

// ── validateInquiryCreationCapacity / validateResponseSubmissionCapacity ─

test('validateInquiryCreationCapacity: checks exactly MAX_OPEN_RFQS', async () => {
  resetMocks();
  await validateInquiryCreationCapacity(1);
  assert.deepEqual(calls.companyLimitFindMany[0].where.key, { in: [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS] });
});

test('validateResponseSubmissionCapacity: checks active + daily + monthly response limits together', async () => {
  resetMocks();
  await validateResponseSubmissionCapacity(1);
  assert.deepEqual(calls.companyLimitFindMany[0].where.key, {
    in: [
      COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES,
      COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES,
      COMPANY_LIMIT_KEYS.MAX_MONTHLY_RFQ_RESPONSES,
    ],
  });
});
