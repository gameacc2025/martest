-- Commercial inquiry plans, subscription periods and auditable quota usage.
CREATE TYPE "InquirySubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "InquiryUsageType" AS ENUM ('INQUIRY_CREATE', 'RESPONSE_SUBMIT', 'INTERNAL_MESSAGE', 'SMS');

CREATE TABLE "InquiryPlan" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "durationDays" INTEGER NOT NULL,
  "price" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IRR',
  "inquiriesPerPeriod" INTEGER NOT NULL DEFAULT 0,
  "responsesPerPeriod" INTEGER NOT NULL DEFAULT 0,
  "internalMessagesPerPeriod" INTEGER NOT NULL DEFAULT 0,
  "smsPerPeriod" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InquiryPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InquiryPlan_code_key" ON "InquiryPlan"("code");
CREATE INDEX "InquiryPlan_isActive_idx" ON "InquiryPlan"("isActive");

CREATE TABLE "InquirySubscription" (
  "id" SERIAL NOT NULL,
  "planId" INTEGER NOT NULL,
  "companyId" INTEGER,
  "userId" INTEGER,
  "status" "InquirySubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "activatedBy" INTEGER,
  "paymentReference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InquirySubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InquirySubscription_exactly_one_owner_check" CHECK (("companyId" IS NOT NULL AND "userId" IS NULL) OR ("companyId" IS NULL AND "userId" IS NOT NULL)),
  CONSTRAINT "InquirySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InquiryPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InquirySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InquirySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InquirySubscription_paymentReference_key" ON "InquirySubscription"("paymentReference");
CREATE INDEX "InquirySubscription_companyId_status_endsAt_idx" ON "InquirySubscription"("companyId", "status", "endsAt");
CREATE INDEX "InquirySubscription_userId_status_endsAt_idx" ON "InquirySubscription"("userId", "status", "endsAt");
CREATE INDEX "InquirySubscription_planId_idx" ON "InquirySubscription"("planId");

CREATE TABLE "InquiryUsageEvent" (
  "id" BIGSERIAL NOT NULL,
  "subscriptionId" INTEGER NOT NULL,
  "usageType" "InquiryUsageType" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "idempotencyKey" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InquiryUsageEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InquiryUsageEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "InquirySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InquiryUsageEvent_idempotencyKey_key" ON "InquiryUsageEvent"("idempotencyKey");
CREATE INDEX "InquiryUsageEvent_subscriptionId_usageType_createdAt_idx" ON "InquiryUsageEvent"("subscriptionId", "usageType", "createdAt");
CREATE INDEX "InquiryUsageEvent_referenceType_referenceId_idx" ON "InquiryUsageEvent"("referenceType", "referenceId");
