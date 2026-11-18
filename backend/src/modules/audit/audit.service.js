// =============================================================
// Audit Log Service — Business logic for AuditLog queries AND creation
//
// Responsibilities:
//   - Staff-only audit log search with filters (existing)
//   - Export audit logs (CSV/JSON) (existing)
//   - Create audit log entries (NEW - append-only)
//   - Access control: only STAFF with audit_logs.read/search permissions
//
// Security:
//   - All methods require STAFF context (validated by caller)
//   - No customer/company data exposed
//   - Append-only table enforced by DB trigger
//   - Sensitive data redaction in metadata
// =============================================================

const prisma = require('../../config/db');
const { createError } = require('./audit.utils');

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;
const EXPORT_MAX_ROWS = 50000;

// Fields that should NEVER be stored in audit metadata
const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'secretHash',
  'otp',
  'code',
  'challenge',
  'verifier',
  'apiKey',
  'apiSecret',
  'privateKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'nationalId',
  'bankAccount',
  'iban',
].map((field) => field.toLowerCase()));

/**
 * Redact sensitive fields from an object recursively.
 * @param {object} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {object} Sanitized object
 */
function redactSensitiveData(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 10) return obj;
  if (Array.isArray(obj)) return obj.map(item => redactSensitiveData(item, depth + 1));
  if (obj instanceof Date) return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.has(lowerKey) || [...SENSITIVE_FIELDS].some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = redactSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Create a safe metadata object with before/after snapshots.
 * @param {object} params
 * @param {object} [params.before] - State before the action
 * @param {object} [params.after] - State after the action
 * @param {object} [params.extra] - Additional context
 * @returns {object} Sanitized metadata
 */
function buildMetadata({ before, after, extra } = {}) {
  const metadata = {};
  if (before) metadata.before = redactSensitiveData(before);
  if (after) metadata.after = redactSensitiveData(after);
  if (extra) metadata.extra = redactSensitiveData(extra);
  return Object.keys(metadata).length > 0 ? metadata : null;
}

/**
 * Extract client IP from request.
 * @param {object} request - Fastify request
 * @returns {string} IP address
 */
function getClientIp(request) {
  // Fastify's request.ip is derived from the socket unless trustProxy is
  // explicitly configured. Never trust caller-controlled forwarding headers
  // here: accepting them without a trusted proxy lets clients spoof audit IPs.
  return request.ip || request.socket?.remoteAddress || 'unknown';
}

/**
 * Extract user agent from request.
 * @param {object} request - Fastify request
 * @returns {string} User agent string
 */
function getUserAgent(request) {
  return request.headers['user-agent'] || 'unknown';
}

/**
 * Get or generate request correlation ID.
 * @param {object} request - Fastify request
 * @returns {string} Correlation ID
 */
function getCorrelationId(request) {
  // Check if already set by middleware
  if (request.correlationId) return request.correlationId;
  // Check headers
  const headerId = request.headers['x-request-id'] || request.headers['x-correlation-id'];
  if (headerId) return headerId;
  // Generate new one
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Record an audit log entry.
 * This is the primary write method for audit logging.
 * Append-only: no update/delete operations provided.
 *
 * @param {object} params
 * @param {object} params.request - Fastify request object (for context extraction)
 * @param {string} params.action - Action name (e.g., 'USER_CREATE', 'PRODUCT_UPDATE')
 * @param {string} params.entityType - Entity type (e.g., 'User', 'Product', 'Company')
 * @param {string|number} params.entityId - Entity ID
 * @param {object} [params.metadata] - Optional pre-built metadata (will be merged with request context)
 * @param {object} [params.before] - State before action (for metadata)
 * @param {object} [params.after] - State after action (for metadata)
 * @param {string} [params.outcome='SUCCESS'] - Outcome: SUCCESS, FAILURE, ERROR
 * @param {string} [params.severity='INFO'] - Severity: INFO, WARN, ERROR, CRITICAL
 * @param {string} [params.source] - Source: ADMIN, WEBSITE, COMPANY, SYSTEM, SEED
 * @returns {Promise<object>} Created audit log entry
 */
async function recordAuditLog({
  request,
  action,
  entityType,
  entityId,
  metadata,
  before,
  after,
  outcome = 'SUCCESS',
  severity = 'INFO',
  source = 'ADMIN',
}) {
  // Extract actor context from request
  const user = request.user;
  const actorUserId = user?.id || null;
  const actorAccessType = user?.accessType || null;
  const companyId = user?.companyId || null;

  // Extract request context
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const requestId = getCorrelationId(request);

  // Build metadata with before/after if provided
  const builtMetadata = buildMetadata({ before, after, extra: metadata });

  // Create audit log entry
  const log = await prisma.auditLog.create({
    data: {
      actorUserId,
      actorAccessType,
      companyId,
      action,
      entityType,
      entityId: String(entityId),
      requestId,
      source,
      outcome,
      severity,
      ipAddress,
      userAgent,
      metadata: builtMetadata,
      occurredAt: new Date(),
    },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorUserId: true,
      actorAccessType: true,
      companyId: true,
      requestId: true,
      source: true,
      outcome: true,
      severity: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      occurredAt: true,
    },
  });

  return log;
}

/**
 * Record an audit log entry with explicit actor context (for non-HTTP contexts).
 * @param {object} params
 * @param {object} [params.tx] - Optional Prisma transaction client
 * @param {number} [params.actorUserId] - Actor user ID
 * @param {string} [params.actorAccessType] - Actor access type (STAFF, COMPANY, CUSTOMER, SYSTEM)
 * @param {number} [params.companyId] - Company ID
 * @param {string} params.action - Action name
 * @param {string} params.entityType - Entity type
 * @param {string|number} params.entityId - Entity ID
 * @param {object} [params.metadata] - Pre-built metadata
 * @param {object} [params.before] - State before
 * @param {object} [params.after] - State after
 * @param {string} [params.outcome='SUCCESS'] - Outcome
 * @param {string} [params.severity='INFO'] - Severity
 * @param {string} [params.source='SYSTEM'] - Source
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.userAgent] - User agent
 * @param {string} [params.requestId] - Correlation ID
 * @returns {Promise<object>} Created audit log entry
 */
async function recordAuditLogExplicit({
  tx = null,
  actorUserId = null,
  actorAccessType = 'SYSTEM',
  companyId = null,
  action,
  entityType,
  entityId,
  metadata,
  before,
  after,
  outcome = 'SUCCESS',
  severity = 'INFO',
  source = 'SYSTEM',
  ipAddress = 'unknown',
  userAgent = 'unknown',
  requestId = `sys-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
}) {
  const builtMetadata = buildMetadata({ before, after, extra: metadata });
  const db = tx || prisma;

  const log = await db.auditLog.create({
    data: {
      actorUserId,
      actorAccessType,
      companyId,
      action,
      entityType,
      entityId: String(entityId),
      requestId,
      source,
      outcome,
      severity,
      ipAddress,
      userAgent,
      metadata: builtMetadata,
      occurredAt: new Date(),
    },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorUserId: true,
      actorAccessType: true,
      companyId: true,
      requestId: true,
      source: true,
      outcome: true,
      severity: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      occurredAt: true,
    },
  });

  return log;
}

/**
 * Search audit logs with filters, pagination, and sorting.
 * Only accessible by STAFF users with audit_logs.read permission.
 *
 * @param {object} params
 * @param {object} params.filters - Filter criteria
 * @param {string} [params.filters.action] - Action name (exact match)
 * @param {string} [params.filters.entityType] - Entity type (exact match)
 * @param {string} [params.filters.entityId] - Entity ID (string in DB)
 * @param {number} [params.filters.userId] - Actor user ID
 * @param {string} [params.filters.ipAddress] - IP address (partial match)
 * @param {string} [params.filters.dateFrom] - ISO date string (inclusive)
 * @param {string} [params.filters.dateTo] - ISO date string (inclusive)
 * @param {string} [params.filters.severity] - Severity level (INFO, WARN, ERROR, CRITICAL)
 * @param {number} [params.page=1] - Page number (1-indexed)
 * @param {number} [params.pageSize=50] - Items per page
 * @param {string} [params.sortBy='occurredAt'] - Sort field
 * @param {string} [params.sortOrder='desc'] - Sort order (asc/desc)
 * @returns {Promise<{data: Array, meta: {total, page, pageSize, totalPages}}>}
 */
async function searchAuditLogs({ filters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE, sortBy = 'occurredAt', sortOrder = 'desc' }) {
  // Validate pagination
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize)));
  const skip = (safePage - 1) * safePageSize;

  // Validate sort - use correct DB field names
  const allowedSortFields = ['occurredAt', 'action', 'entityType', 'entityId', 'actorUserId', 'ipAddress', 'severity'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'occurredAt';
  const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  // Build where clause - using correct DB field names
  const where = {};

  if (filters.action) {
    where.action = { equals: filters.action, mode: 'insensitive' };
  }

  if (filters.entityType) {
    where.entityType = { equals: filters.entityType, mode: 'insensitive' };
  }

  if (filters.entityId !== undefined && filters.entityId !== null && filters.entityId !== '') {
    where.entityId = String(filters.entityId); // entityId is String in DB
  }

  if (filters.userId !== undefined && filters.userId !== null && filters.userId !== '') {
    where.actorUserId = Number(filters.userId); // DB field is actorUserId
  }

  if (filters.ipAddress) {
    where.ipAddress = { contains: filters.ipAddress, mode: 'insensitive' };
  }

  if (filters.severity) {
    where.severity = { equals: filters.severity, mode: 'insensitive' };
  }

  // Date range filter - DB field is occurredAt
  if (filters.dateFrom || filters.dateTo) {
    where.occurredAt = {};
    if (filters.dateFrom) {
      where.occurredAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      // Add 1 day to make dateTo inclusive of the entire day
      const toDate = new Date(filters.dateTo);
      toDate.setDate(toDate.getDate() + 1);
      where.occurredAt.lt = toDate;
    }
  }

  // Execute queries
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: safePageSize,
      orderBy: { [safeSortBy]: safeSortOrder },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actorUserId: true,        // DB field name
        actor: {                  // Join to get user info
          select: {
            email: true,
            phone: true,
          },
        },
        actorAccessType: true,
        companyId: true,
        requestId: true,
        source: true,
        outcome: true,
        ipAddress: true,
        userAgent: true,
        severity: true,
        metadata: true,
        occurredAt: true,         // DB field name
      },
    }),
  ]);

  const totalPages = Math.ceil(total / safePageSize);

  // Transform to match expected response format
  const transformedLogs = logs.map(log => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userId: log.actorUserId,
    actorAccessType: log.actorAccessType,
    companyId: log.companyId,
    requestId: log.requestId,
    source: log.source,
    outcome: log.outcome,
    userEmail: log.actor?.email ?? null,
    userPhone: log.actor?.phone ?? null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    severity: log.severity,
    metadata: log.metadata,
    createdAt: log.occurredAt,    // Map occurredAt to createdAt for response
  }));

  return {
    data: transformedLogs,
    meta: {
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    },
  };
}

/**
 * Get audit log statistics for dashboard/summary views.
 * @param {object} params - Optional date range filters
 * @param {string} [params.dateFrom] - ISO date string
 * @param {string} [params.dateTo] - ISO date string
 * @returns {Promise<object>}
 */
async function getAuditStats({ dateFrom, dateTo } = {}) {
  const where = {};

  if (dateFrom || dateTo) {
    where.occurredAt = {};
    if (dateFrom) where.occurredAt.gte = new Date(dateFrom);
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      where.occurredAt.lt = toDate;
    }
  }

  const [total, bySeverity, byAction, byEntityType, recentErrors] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: { severity: true },
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    }),
    prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: { entityType: true },
      orderBy: { _count: { entityType: 'desc' } },
      take: 20,
    }),
    prisma.auditLog.findMany({
      where: { ...where, severity: { in: ['ERROR', 'CRITICAL'] } },
      orderBy: { occurredAt: 'desc' },
      take: 10,
      select: { id: true, action: true, entityType: true, entityId: true, severity: true, occurredAt: true, metadata: true },
    }),
  ]);

  return {
    total,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count.severity;
      return acc;
    }, {}),
    topActions: byAction.map(item => ({ action: item.action, count: item._count.action })),
    topEntityTypes: byEntityType.map(item => ({ entityType: item.entityType, count: item._count.entityType })),
    recentErrors: recentErrors.map(log => ({
      ...log,
      createdAt: log.occurredAt,  // Map for response
    })),
  };
}

/**
 * Get a single audit log entry by ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function getAuditLogById(id) {
  const log = await prisma.auditLog.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorUserId: true,
      actorAccessType: true,
      companyId: true,
      requestId: true,
      source: true,
      outcome: true,
      actor: { select: { email: true, phone: true } },
      ipAddress: true,
      userAgent: true,
      severity: true,
      metadata: true,
      occurredAt: true,
    },
  });

  if (!log) return null;

  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userId: log.actorUserId,
    actorAccessType: log.actorAccessType,
    companyId: log.companyId,
    requestId: log.requestId,
    source: log.source,
    outcome: log.outcome,
    userEmail: log.actor?.email ?? null,
    userPhone: log.actor?.phone ?? null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    severity: log.severity,
    metadata: log.metadata,
    createdAt: log.occurredAt,
  };
}

/**
 * Export audit logs as array of objects (for CSV/JSON generation).
 * Limited to EXPORT_MAX_ROWS rows.
 * @param {object} params - Same filters as searchAuditLogs
 * @returns {Promise<Array>}
 */
async function exportAuditLogs({ filters = {}, sortBy = 'occurredAt', sortOrder = 'desc' } = {}) {
  // Validate sort
  const allowedSortFields = ['occurredAt', 'action', 'entityType', 'entityId', 'actorUserId', 'ipAddress', 'severity'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'occurredAt';
  const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  // Build where clause (same as searchAuditLogs)
  const where = {};

  if (filters.action) where.action = { equals: filters.action, mode: 'insensitive' };
  if (filters.entityType) where.entityType = { equals: filters.entityType, mode: 'insensitive' };
  if (filters.entityId !== undefined && filters.entityId !== null && filters.entityId !== '') where.entityId = String(filters.entityId);
  if (filters.userId !== undefined && filters.userId !== null && filters.userId !== '') where.actorUserId = Number(filters.userId);
  if (filters.ipAddress) where.ipAddress = { contains: filters.ipAddress, mode: 'insensitive' };
  if (filters.severity) where.severity = { equals: filters.severity, mode: 'insensitive' };
  if (filters.dateFrom || filters.dateTo) {
    where.occurredAt = {};
    if (filters.dateFrom) where.occurredAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setDate(toDate.getDate() + 1);
      where.occurredAt.lt = toDate;
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { [safeSortBy]: safeSortOrder },
    take: EXPORT_MAX_ROWS,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorUserId: true,
      actorAccessType: true,
      companyId: true,
      requestId: true,
      source: true,
      outcome: true,
      actor: { select: { email: true, phone: true } },
      ipAddress: true,
      userAgent: true,
      severity: true,
      metadata: true,
      occurredAt: true,
    },
  });

  return logs.map(log => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userId: log.actorUserId,
    actorAccessType: log.actorAccessType,
    companyId: log.companyId,
    requestId: log.requestId,
    source: log.source,
    outcome: log.outcome,
    userEmail: log.actor?.email ?? null,
    userPhone: log.actor?.phone ?? null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    severity: log.severity,
    metadata: log.metadata,
    createdAt: log.occurredAt,
  }));
}

module.exports = {
  // Write operations (NEW)
  recordAuditLog,
  recordAuditLogExplicit,
  buildMetadata,
  redactSensitiveData,
  getClientIp,
  getUserAgent,
  getCorrelationId,

  // Read operations (existing)
  searchAuditLogs,
  getAuditStats,
  getAuditLogById,
  exportAuditLogs,

  // Constants
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  EXPORT_MAX_ROWS,
  SENSITIVE_FIELDS,
};