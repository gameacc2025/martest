// =============================================================
// Company Rule Service
//
// Centralizes company-level limit checks used by workflow modules.
// Limits are configured as CompanyLimit key/value records so new
// limits can be added without changing this service shape.
// =============================================================

const prisma = require('../../config/db');

const COMPANY_LIMIT_KEYS = Object.freeze({
  MAX_OPEN_RFQS: 'rfq.max_open',
  MAX_ACTIVE_RFQ_RESPONSES: 'rfq_response.max_active',
  MAX_DAILY_RFQ_RESPONSES: 'rfq_response.max_daily',
  MAX_MONTHLY_RFQ_RESPONSES: 'rfq_response.max_monthly',
});

const OPEN_INQUIRY_STATUSES = ['DRAFT', 'SUBMITTED', 'OPEN'];
const ACTIVE_RESPONSE_STATUSES = ['PENDING'];

const RFQ_LIMIT_DEFINITIONS = Object.freeze({
  [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS]: {
    code: 'MAX_OPEN_RFQS_EXCEEDED',
    message: (max) => `امکان ثبت درخواست جدید وجود ندارد. سقف درخواست‌های باز شرکت (${max}) تکمیل شده است.`,
    count: (companyId, client) => client.inquiry.count({
      where: {
        companyId,
        status: { in: OPEN_INQUIRY_STATUSES },
      },
    }),
  },
  [COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES]: {
    code: 'MAX_ACTIVE_RFQ_RESPONSES_EXCEEDED',
    message: (max) => `امکان ثبت پاسخ جدید وجود ندارد. سقف پاسخ‌های فعال شرکت (${max}) تکمیل شده است.`,
    count: (companyId, client) => client.inquiryResponse.count({
      where: {
        companyId,
        status: { in: ACTIVE_RESPONSE_STATUSES },
      },
    }),
  },
  [COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES]: {
    code: 'MAX_DAILY_RFQ_RESPONSES_EXCEEDED',
    message: (max) => `امکان ثبت پاسخ جدید وجود ندارد. سقف پاسخ‌های روزانه شرکت (${max}) تکمیل شده است.`,
    count: (companyId, client, now = new Date()) => client.inquiryResponse.count({
      where: {
        companyId,
        createdAt: { gte: startOfDay(now) },
      },
    }),
  },
  [COMPANY_LIMIT_KEYS.MAX_MONTHLY_RFQ_RESPONSES]: {
    code: 'MAX_MONTHLY_RFQ_RESPONSES_EXCEEDED',
    message: (max) => `امکان ثبت پاسخ جدید وجود ندارد. سقف پاسخ‌های ماهانه شرکت (${max}) تکمیل شده است.`,
    count: (companyId, client, now = new Date()) => client.inquiryResponse.count({
      where: {
        companyId,
        createdAt: { gte: startOfMonth(now) },
      },
    }),
  },
});

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function normalizeCompanyId(companyId) {
  const numericCompanyId = Number(companyId);
  if (!Number.isInteger(numericCompanyId) || numericCompanyId < 1) {
    throw { statusCode: 400, code: 'COMPANY_REQUIRED', message: 'شناسه شرکت الزامی است.' };
  }
  return numericCompanyId;
}

async function getConfiguredLimits(companyId, keys, client = prisma) {
  const numericCompanyId = normalizeCompanyId(companyId);
  const limits = await client.companyLimit.findMany({
    where: {
      companyId: numericCompanyId,
      key: { in: keys },
    },
  });

  return new Map(limits.map((limit) => [limit.key, limit.value]));
}

function assertLimitValue(limit) {
  if (!Number.isInteger(limit.value) || limit.value < 0) {
    throw {
      statusCode: 500,
      code: 'INVALID_COMPANY_LIMIT',
      message: `Invalid company limit value for ${limit.key}.`,
      details: { key: limit.key, value: limit.value },
    };
  }
}

async function evaluateCompanyLimits(companyId, keys, client = prisma) {
  const numericCompanyId = normalizeCompanyId(companyId);
  const configuredLimits = await getConfiguredLimits(numericCompanyId, keys, client);
  const results = [];

  for (const key of keys) {
    if (!configuredLimits.has(key)) continue;

    const definition = RFQ_LIMIT_DEFINITIONS[key];
    if (!definition) {
      throw { statusCode: 500, code: 'UNKNOWN_COMPANY_LIMIT', message: `Unknown company limit key: ${key}.` };
    }

    const limit = { key, value: configuredLimits.get(key) };
    assertLimitValue(limit);

    const current = await definition.count(numericCompanyId, client);
    if (current >= limit.value) {
      throw {
        statusCode: 400,
        code: definition.code,
        message: definition.message(limit.value),
        details: { key, current, max: limit.value },
      };
    }

    results.push({ key, current, max: limit.value });
  }

  return results;
}

async function validateInquiryCreationCapacity(companyId, client = prisma) {
  return evaluateCompanyLimits(companyId, [COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS], client);
}

async function validateResponseSubmissionCapacity(companyId, client = prisma) {
  return evaluateCompanyLimits(companyId, [
    COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES,
    COMPANY_LIMIT_KEYS.MAX_DAILY_RFQ_RESPONSES,
    COMPANY_LIMIT_KEYS.MAX_MONTHLY_RFQ_RESPONSES,
  ], client);
}

module.exports = {
  COMPANY_LIMIT_KEYS,
  OPEN_INQUIRY_STATUSES,
  ACTIVE_RESPONSE_STATUSES,
  evaluateCompanyLimits,
  validateInquiryCreationCapacity,
  validateResponseSubmissionCapacity,
};