-- Product edit lifecycle:
--   1. Products track how many post-approval edits a company made
--      (editsSinceApproval). At the system-configurable threshold they are
--      automatically sent back to PENDING_REVIEW.
--   2. An immutable ProductActivityLog records every content mutation
--      (field edits, price-tier/media changes, workflow transitions).
--   3. A SystemSetting key/value store holds admin-managed platform settings
--      such as the review threshold.

-- CreateEnum
CREATE TYPE "ProductActivityAction" AS ENUM (
  'CREATE',
  'EDIT',
  'PRICE_TIER_CREATE',
  'PRICE_TIER_UPDATE',
  'PRICE_TIER_DELETE',
  'IMAGE_UPLOAD',
  'IMAGE_DELETE',
  'IMAGE_SET_PRIMARY',
  'IMAGE_SORT',
  'DOCUMENT_UPLOAD',
  'DOCUMENT_DELETE',
  'SUBMIT_REVIEW',
  'APPROVE',
  'REJECT',
  'PUBLISH',
  'HIDE',
  'ARCHIVE',
  'RESTORE_DRAFT'
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "editsSinceApproval" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductActivityLog" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "actorUserId" INTEGER NOT NULL,
    "action" "ProductActivityAction" NOT NULL,
    "detail" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductActivityLog_productId_idx" ON "ProductActivityLog"("productId");
CREATE INDEX "ProductActivityLog_actorUserId_idx" ON "ProductActivityLog"("actorUserId");
CREATE INDEX "ProductActivityLog_action_idx" ON "ProductActivityLog"("action");
CREATE INDEX "ProductActivityLog_createdAt_idx" ON "ProductActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductActivityLog" ADD CONSTRAINT "ProductActivityLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductActivityLog" ADD CONSTRAINT "ProductActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");