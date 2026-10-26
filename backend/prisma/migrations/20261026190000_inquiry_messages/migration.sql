-- Buyer/supplier private messages attached to an inquiry.
CREATE TABLE "InquiryMessage" (
  "id" SERIAL NOT NULL,
  "inquiryId" INTEGER NOT NULL,
  "senderUserId" INTEGER,
  "senderCompanyId" INTEGER,
  "recipientUserId" INTEGER,
  "recipientCompanyId" INTEGER,
  "body" VARCHAR(5000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InquiryMessage_sender_identity_check"
    CHECK (("senderUserId" IS NOT NULL)::integer + ("senderCompanyId" IS NOT NULL)::integer = 1),
  CONSTRAINT "InquiryMessage_recipient_identity_check"
    CHECK (("recipientUserId" IS NOT NULL)::integer + ("recipientCompanyId" IS NOT NULL)::integer = 1)
);

CREATE INDEX "InquiryMessage_inquiryId_createdAt_idx" ON "InquiryMessage"("inquiryId", "createdAt");
CREATE INDEX "InquiryMessage_senderUserId_idx" ON "InquiryMessage"("senderUserId");
CREATE INDEX "InquiryMessage_senderCompanyId_idx" ON "InquiryMessage"("senderCompanyId");
CREATE INDEX "InquiryMessage_recipientUserId_idx" ON "InquiryMessage"("recipientUserId");
CREATE INDEX "InquiryMessage_recipientCompanyId_idx" ON "InquiryMessage"("recipientCompanyId");

ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderUserId_fkey"
  FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderCompanyId_fkey"
  FOREIGN KEY ("senderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_recipientCompanyId_fkey"
  FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
