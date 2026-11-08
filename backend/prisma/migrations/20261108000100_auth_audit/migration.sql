-- Additive migration; existing core tables and records are preserved.
CREATE TYPE "AuthChallengePurpose" AS ENUM ('PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION');
CREATE TYPE "AuthChallengeChannel" AS ENUM ('SMS', 'EMAIL');
CREATE TABLE "AuthChallenge" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "purpose" "AuthChallengePurpose" NOT NULL,
  "channel" "AuthChallengeChannel" NOT NULL,
  "destination" VARCHAR(320) NOT NULL,
  "secretHash" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "invalidatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthChallenge_secretHash_key" UNIQUE ("secretHash")
);

CREATE TABLE "AuditLog" (
  "id" BIGSERIAL NOT NULL,
  "actorUserId" INTEGER,
  "actorAccessType" VARCHAR(20),
  "companyId" INTEGER,
  "action" VARCHAR(120) NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" VARCHAR(100) NOT NULL,
  "requestId" VARCHAR(100),
  "source" VARCHAR(40),
  "outcome" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  "ipAddress" VARCHAR(64),
  "userAgent" VARCHAR(500),
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuthChallenge" ADD CONSTRAINT "AuthChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "AuthChallenge_userId_purpose_createdAt_idx" ON "AuthChallenge" ("userId", "purpose", "createdAt");
CREATE INDEX "AuthChallenge_expiresAt_idx" ON "AuthChallenge" ("expiresAt");
CREATE INDEX "AuthChallenge_destination_purpose_createdAt_idx" ON "AuthChallenge" ("destination", "purpose", "createdAt");
CREATE INDEX "AuditLog_actorUserId_occurredAt_idx" ON "AuditLog" ("actorUserId", "occurredAt");
CREATE INDEX "AuditLog_companyId_occurredAt_idx" ON "AuditLog" ("companyId", "occurredAt");
CREATE INDEX "AuditLog_entityType_entityId_occurredAt_idx" ON "AuditLog" ("entityType", "entityId", "occurredAt");
CREATE INDEX "AuditLog_action_occurredAt_idx" ON "AuditLog" ("action", "occurredAt");
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog" ("requestId");
ALTER TABLE "AuthChallenge" ADD CONSTRAINT "AuthChallenge_attempts_check" CHECK ("attemptCount" >= 0 AND "maxAttempts" > 0 AND "attemptCount" <= "maxAttempts");
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'AuditLog is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "AuditLog_no_update" BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
ALTER TABLE "AuthChallenge" ADD CONSTRAINT "AuthChallenge_expiry_after_creation_check" CHECK ("expiresAt" > "createdAt");
CREATE UNIQUE INDEX "AuthChallenge_one_outstanding_per_purpose_channel_idx" ON "AuthChallenge" ("userId", "purpose", "channel") WHERE "consumedAt" IS NULL AND "invalidatedAt" IS NULL;
