ALTER TABLE "InquirySubscription"
  ADD COLUMN "paymentProvider" TEXT,
  ADD COLUMN "paymentAuthority" TEXT,
  ADD COLUMN "paymentRefId" TEXT,
  ADD COLUMN "paymentAmount" INTEGER,
  ADD COLUMN "paymentVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "InquirySubscription_paymentAuthority_key"
  ON "InquirySubscription"("paymentAuthority");
CREATE INDEX "InquirySubscription_paymentProvider_idx"
  ON "InquirySubscription"("paymentProvider");
