-- Add device metadata fields to RefreshToken table
ALTER TABLE "RefreshToken" ADD COLUMN "userAgent" VARCHAR(500);
ALTER TABLE "RefreshToken" ADD COLUMN "ipAddress" VARCHAR(64);
ALTER TABLE "RefreshToken" ADD COLUMN "deviceName" VARCHAR(120);
ALTER TABLE "RefreshToken" ADD COLUMN "lastUsedAt" TIMESTAMP(3);

-- Add index on lastUsedAt for session cleanup queries
CREATE INDEX "RefreshToken_lastUsedAt_idx" ON "RefreshToken"("lastUsedAt");