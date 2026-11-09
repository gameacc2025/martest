// =============================================================
// Audit Log Controller — HTTP handlers for audit log queries
//
// Endpoints (STAFF only):
//   GET    /audit/logs         - Search audit logs with filters
//   GET    /audit/logs/stats   - Get audit log statistics
//   GET    /audit/logs/:id     - Get single audit log entry
//   GET    /audit/logs/export  - Export audit logs (CSV/JSON)
// =============================================================

const service = require('./audit.service');
const { createError, requireStaffAccess } = require('./audit.utils');

/**
 * GET /audit/logs
 * Search audit logs with filters and pagination.
 * Query params: action, entityType, entityId, userId, ipAddress, severity, dateFrom, dateTo, page, pageSize, sortBy, sortOrder
 */
async function searchAuditLogsHandler(request, reply) {
  const user = request.user;
  requireStaffAccess(user);

  const {
    action,
    entityType,
    entityId,
    userId,
    ipAddress,
    severity,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 50,
    sortBy = 'occurredAt',
    sortOrder = 'desc',
  } = request.query;

  const filters = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (entityId !== undefined && entityId !== '') filters.entityId = entityId;
  if (userId !== undefined && userId !== '') filters.userId = userId;
  if (ipAddress) filters.ipAddress = ipAddress;
  if (severity) filters.severity = severity;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const result = await service.searchAuditLogs({
    filters,
    page: Number(page),
    pageSize: Number(pageSize),
    sortBy,
    sortOrder,
  });

  return reply.send({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

/**
 * GET /audit/logs/stats
 * Get audit log statistics for dashboard.
 * Query params: dateFrom, dateTo
 */
async function getAuditStatsHandler(request, reply) {
  const user = request.user;
  requireStaffAccess(user);

  const { dateFrom, dateTo } = request.query;

  const stats = await service.getAuditStats({ dateFrom, dateTo });

  return reply.send({
    success: true,
    data: stats,
  });
}

/**
 * GET /audit/logs/:id
 * Get a single audit log entry by ID.
 */
async function getAuditLogByIdHandler(request, reply) {
  const user = request.user;
  requireStaffAccess(user);

  const { id } = request.params;

  const log = await service.getAuditLogById(id);

  if (!log) {
    throw createError(404, 'NOT_FOUND', 'ورود ثبت‌رویداد یافت نشد.');
  }

  return reply.send({
    success: true,
    data: log,
  });
}

/**
 * GET /audit/logs/export
 * Export audit logs as CSV or JSON.
 * Query params: format (csv|json), action, entityType, entityId, userId, ipAddress, severity, dateFrom, dateTo, sortBy, sortOrder
 */
async function exportAuditLogsHandler(request, reply) {
  const user = request.user;
  requireStaffAccess(user);

  const {
    format = 'json',
    action,
    entityType,
    entityId,
    userId,
    ipAddress,
    severity,
    dateFrom,
    dateTo,
    sortBy = 'occurredAt',
    sortOrder = 'desc',
  } = request.query;

  const filters = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (entityId !== undefined && entityId !== '') filters.entityId = entityId;
  if (userId !== undefined && userId !== '') filters.userId = userId;
  if (ipAddress) filters.ipAddress = ipAddress;
  if (severity) filters.severity = severity;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const logs = await service.exportAuditLogs({
    filters,
    sortBy,
    sortOrder,
  });

  if (format === 'csv') {
    // Convert to CSV
    const headers = ['id', 'action', 'entityType', 'entityId', 'userId', 'userEmail', 'userPhone', 'ipAddress', 'userAgent', 'severity', 'metadata', 'createdAt'];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => headers.map(h => {
        const value = log[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
        return '"' + String(value).replace(/"/g, '""') + '"';
      }).join(','))
    ];
    const csv = csvRows.join('\n');

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`)
      .send(csv);
  }

  // Default: JSON
  return reply
    .header('Content-Type', 'application/json; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`)
    .send({ success: true, data: logs, meta: { count: logs.length, exportedAt: new Date().toISOString() } });
}

module.exports = {
  searchAuditLogsHandler,
  getAuditStatsHandler,
  getAuditLogByIdHandler,
  exportAuditLogsHandler,
};