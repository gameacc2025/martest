// =============================================================
// Audit Log Service — Business logic for AuditLog queries
//
// Responsibilities:
//   - Staff-only audit log search with filters
//   - Export audit logs (CSV/JSON)
//   - Access control: only STAFF with audit_logs.read/search permissions
//
// Security:
//   - All methods require STAFF context (validated by caller)
//   - No customer/company data exposed
//   - Append-only table enforced by DB trigger
// =============================================================

const prisma = require('../../config/db');
const { createError } = require('./audit.utils');

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;
const EXPORT_MAX_ROWS = 50000;

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
  searchAuditLogs,
  getAuditStats,
  getAuditLogById,
  exportAuditLogs,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  EXPORT_MAX_ROWS,
};