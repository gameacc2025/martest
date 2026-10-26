-- Support both existing company-owned B2B inquiries and Website customer inquiries.
-- Existing rows remain company-owned; no historical data is reassigned.
ALTER TABLE "Inquiry" ALTER COLUMN "companyId" DROP NOT NULL;
ALTER TABLE "Inquiry" ADD COLUMN "buyerUserId" INTEGER;

CREATE INDEX "Inquiry_buyerUserId_idx" ON "Inquiry"("buyerUserId");

ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_buyerUserId_fkey"
  FOREIGN KEY ("buyerUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- A request must have exactly one owner: either a company or a customer user.
ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_exactly_one_buyer_check"
  CHECK (
    ("companyId" IS NOT NULL AND "buyerUserId" IS NULL)
    OR ("companyId" IS NULL AND "buyerUserId" IS NOT NULL)
  );

-- Scheduled transitions are system actions; preserve them in the same history
-- stream without inventing a human actor.
ALTER TABLE "InquiryStatusHistory" ALTER COLUMN "changedByUserId" DROP NOT NULL;
ALTER TABLE "InquiryStatusHistory" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'USER';
