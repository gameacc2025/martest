-- UPDATE and DELETE are already blocked; TRUNCATE is a separate PostgreSQL
-- operation and needs its own statement-level trigger to preserve append-only logs.
CREATE TRIGGER "AuditLog_no_truncate"
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT
  EXECUTE FUNCTION prevent_audit_log_mutation();
