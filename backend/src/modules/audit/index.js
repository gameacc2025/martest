// =============================================================
// Audit Module — Public API exports
// =============================================================

const service = require('./audit.service');
const routes = require('./audit.routes');

module.exports = {
  // Service methods for recording audit logs (write operations)
  recordAuditLog: service.recordAuditLog,
  recordAuditLogExplicit: service.recordAuditLogExplicit,
  buildMetadata: service.buildMetadata,
  redactSensitiveData: service.redactSensitiveData,
  getClientIp: service.getClientIp,
  getUserAgent: service.getUserAgent,
  getCorrelationId: service.getCorrelationId,

  // Read operations
  searchAuditLogs: service.searchAuditLogs,
  getAuditStats: service.getAuditStats,
  getAuditLogById: service.getAuditLogById,
  exportAuditLogs: service.exportAuditLogs,

  // Constants
  DEFAULT_PAGE_SIZE: service.DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE: service.MAX_PAGE_SIZE,
  EXPORT_MAX_ROWS: service.EXPORT_MAX_ROWS,
  SENSITIVE_FIELDS: service.SENSITIVE_FIELDS,

  // Routes
  routes,
};