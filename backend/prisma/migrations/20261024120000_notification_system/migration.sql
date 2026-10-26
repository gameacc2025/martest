-- Central notification dispatch — schema additions (flow/06-plan-notifications.md).
-- Applied by hand (no live DB in this environment); run `prisma migrate deploy`
-- (or `prisma migrate dev`) to apply. Additive only — no existing column changes.

-- Notification gains event typing + a structured payload.
ALTER TABLE "Notification" ADD COLUMN "type" TEXT;
ALTER TABLE "Notification" ADD COLUMN "data" JSONB;

CREATE INDEX "Notification_type_idx" ON "Notification"("type");

CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "notificationId" INTEGER,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "provider" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_eventType_channel_key" ON "NotificationPreference"("userId", "eventType", "channel");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_eventType_dedupeKey_channel_key" ON "NotificationDelivery"("eventType", "dedupeKey", "channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_idx" ON "NotificationDelivery"("userId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_eventType_idx" ON "NotificationDelivery"("eventType");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_status_nextAttemptAt_idx" ON "NotificationDelivery"("channel", "status", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
