-- Private buyer/respondent messages with subscription usage enforcement.
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
  CONSTRAINT "InquiryMessage_exactly_one_sender_check" CHECK (("senderUserId" IS NOT NULL AND "senderCompanyId" IS NULL) OR ("senderUserId" IS NULL AND "senderCompanyId" IS NOT NULL)),
  CONSTRAINT "InquiryMessage_exactly_one_recipient_check" CHECK (("recipientUserId" IS NOT NULL AND "recipientCompanyId" IS NULL) OR ("recipientUserId" IS NULL AND "recipientCompanyId" IS NOT NULL)),
  CONSTRAINT "InquiryMessage_body_not_empty_check" CHECK (length(trim("body")) > 0),
  CONSTRAINT "InquiryMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InquiryMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InquiryMessage_senderCompanyId_fkey" FOREIGN KEY ("senderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InquiryMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InquiryMessage_recipientCompanyId_fkey" FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InquiryMessage_inquiryId_createdAt_idx" ON "InquiryMessage"("inquiryId", "createdAt");
CREATE INDEX "InquiryMessage_senderUserId_idx" ON "InquiryMessage"("senderUserId");
CREATE INDEX "InquiryMessage_senderCompanyId_idx" ON "InquiryMessage"("senderCompanyId");
CREATE INDEX "InquiryMessage_recipientUserId_idx" ON "InquiryMessage"("recipientUserId");
CREATE INDEX "InquiryMessage_recipientCompanyId_idx" ON "InquiryMessage"("recipientCompanyId");
