-- Add the severity field used by AuditLog filters, exports and dashboard summaries.
ALTER TABLE "AuditLog"
  ADD COLUMN "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO';

CREATE INDEX "AuditLog_severity_occurredAt_idx"
  ON "AuditLog" ("severity", "occurredAt");

COMMENT ON COLUMN "AuditLog"."severity" IS 'سطح اهمیت رخداد ممیزی: INFO، WARN، ERROR یا CRITICAL';
