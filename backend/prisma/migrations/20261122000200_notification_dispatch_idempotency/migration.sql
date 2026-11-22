-- Additive, nullable idempotency keys for exactly-once campaign audit and in-app dispatch.
-- Existing audit and notification rows remain unchanged (NULL keys are not unique).
ALTER TABLE "AuditLog" ADD COLUMN "idempotencyKey" VARCHAR(128);
CREATE UNIQUE INDEX "AuditLog_idempotencyKey_key" ON "AuditLog" ("idempotencyKey");

ALTER TABLE "Notification" ADD COLUMN "dedupeKey" VARCHAR(160);
CREATE UNIQUE INDEX "Notification_userId_type_dedupeKey_key"
  ON "Notification" ("userId", "type", "dedupeKey");
