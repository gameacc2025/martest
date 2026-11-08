-- Additive migration; existing core tables and records are preserved.
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY', 'RESOLVED', 'CLOSED', 'SPAM');
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "SupportMessageVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "SupportCreatedFrom" AS ENUM ('WEBSITE', 'COMPANY', 'ADMIN');
CREATE TYPE "SupportAttachmentStatus" AS ENUM ('PENDING_SCAN', 'AVAILABLE', 'REJECTED');
CREATE TABLE "SupportQueue" (
  "id" SERIAL NOT NULL,
  "key" VARCHAR(60) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportQueue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportQueue_key_key" UNIQUE ("key")
);

CREATE TABLE "SupportCategory" (
  "id" SERIAL NOT NULL,
  "key" VARCHAR(60) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportCategory_key_key" UNIQUE ("key")
);

CREATE TABLE "SupportSlaPolicy" (
  "id" SERIAL NOT NULL,
  "categoryId" INTEGER,
  "priority" "SupportPriority" NOT NULL,
  "firstResponseMinutes" INTEGER NOT NULL,
  "resolutionMinutes" INTEGER NOT NULL,
  "workingCalendar" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportSlaPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
  "id" SERIAL NOT NULL,
  "ticketNumber" VARCHAR(32) NOT NULL,
  "requesterUserId" INTEGER NOT NULL,
  "requesterCompanyId" INTEGER,
  "categoryId" INTEGER,
  "assignedQueueId" INTEGER,
  "assignedUserId" INTEGER,
  "createdFrom" "SupportCreatedFrom" NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN'::"SupportTicketStatus",
  "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL'::"SupportPriority",
  "subject" VARCHAR(200) NOT NULL,
  "firstResponseDueAt" TIMESTAMP(3),
  "resolveDueAt" TIMESTAMP(3),
  "firstRespondedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportTicket_ticketNumber_key" UNIQUE ("ticketNumber")
);

CREATE TABLE "SupportMessage" (
  "id" SERIAL NOT NULL,
  "ticketId" INTEGER NOT NULL,
  "senderUserId" INTEGER NOT NULL,
  "visibility" "SupportMessageVisibility" NOT NULL DEFAULT 'PUBLIC'::"SupportMessageVisibility",
  "body" VARCHAR(10000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportAttachment" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "uploadedByUserId" INTEGER NOT NULL,
  "storageKey" VARCHAR(500) NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(150) NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "checksum" VARCHAR(128),
  "status" "SupportAttachmentStatus" NOT NULL DEFAULT 'PENDING_SCAN'::"SupportAttachmentStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportAttachment_storageKey_key" UNIQUE ("storageKey")
);

CREATE TABLE "SupportAssignment" (
  "id" SERIAL NOT NULL,
  "ticketId" INTEGER NOT NULL,
  "queueId" INTEGER,
  "assignedUserId" INTEGER,
  "assignedByUserId" INTEGER NOT NULL,
  "reason" VARCHAR(500),
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "SupportAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportStatusHistory" (
  "id" SERIAL NOT NULL,
  "ticketId" INTEGER NOT NULL,
  "previous" "SupportTicketStatus",
  "next" "SupportTicketStatus" NOT NULL,
  "actorUserId" INTEGER,
  "reason" VARCHAR(1000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportEvent" (
  "id" BIGSERIAL NOT NULL,
  "ticketId" INTEGER,
  "actorUserId" INTEGER,
  "eventType" VARCHAR(100) NOT NULL,
  "dedupeKey" VARCHAR(160),
  "payload" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "SupportEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportEvent_dedupeKey_key" UNIQUE ("dedupeKey")
);

ALTER TABLE "SupportSlaPolicy" ADD CONSTRAINT "SupportSlaPolicy_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupportCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterCompanyId_fkey" FOREIGN KEY ("requesterCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupportCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedQueueId_fkey" FOREIGN KEY ("assignedQueueId") REFERENCES "SupportQueue" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SupportMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "SupportQueue" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportStatusHistory" ADD CONSTRAINT "SupportStatusHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportStatusHistory" ADD CONSTRAINT "SupportStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportEvent" ADD CONSTRAINT "SupportEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportEvent" ADD CONSTRAINT "SupportEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "SupportQueue_isActive_sortOrder_idx" ON "SupportQueue" ("isActive", "sortOrder");
CREATE INDEX "SupportCategory_isActive_sortOrder_idx" ON "SupportCategory" ("isActive", "sortOrder");
CREATE UNIQUE INDEX "SupportSlaPolicy_categoryId_priority_key" ON "SupportSlaPolicy" ("categoryId", "priority");
CREATE INDEX "SupportSlaPolicy_isActive_priority_idx" ON "SupportSlaPolicy" ("isActive", "priority");
CREATE INDEX "SupportTicket_requesterUserId_status_updatedAt_idx" ON "SupportTicket" ("requesterUserId", "status", "updatedAt");
CREATE INDEX "SupportTicket_requesterCompanyId_status_updatedAt_idx" ON "SupportTicket" ("requesterCompanyId", "status", "updatedAt");
CREATE INDEX "SupportTicket_assignedQueueId_status_priority_lastActivityAt_i" ON "SupportTicket" ("assignedQueueId", "status", "priority", "lastActivityAt");
CREATE INDEX "SupportTicket_assignedUserId_status_priority_idx" ON "SupportTicket" ("assignedUserId", "status", "priority");
CREATE INDEX "SupportTicket_status_priority_firstResponseDueAt_idx" ON "SupportTicket" ("status", "priority", "firstResponseDueAt");
CREATE INDEX "SupportTicket_status_resolveDueAt_idx" ON "SupportTicket" ("status", "resolveDueAt");
CREATE INDEX "SupportTicket_categoryId_idx" ON "SupportTicket" ("categoryId");
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage" ("ticketId", "createdAt");
CREATE INDEX "SupportMessage_senderUserId_createdAt_idx" ON "SupportMessage" ("senderUserId", "createdAt");
CREATE INDEX "SupportMessage_ticketId_visibility_createdAt_idx" ON "SupportMessage" ("ticketId", "visibility", "createdAt");
CREATE INDEX "SupportAttachment_messageId_idx" ON "SupportAttachment" ("messageId");
CREATE INDEX "SupportAttachment_uploadedByUserId_createdAt_idx" ON "SupportAttachment" ("uploadedByUserId", "createdAt");
CREATE INDEX "SupportAttachment_status_createdAt_idx" ON "SupportAttachment" ("status", "createdAt");
CREATE INDEX "SupportAssignment_ticketId_assignedAt_idx" ON "SupportAssignment" ("ticketId", "assignedAt");
CREATE INDEX "SupportAssignment_assignedUserId_endedAt_idx" ON "SupportAssignment" ("assignedUserId", "endedAt");
CREATE INDEX "SupportAssignment_queueId_endedAt_idx" ON "SupportAssignment" ("queueId", "endedAt");
CREATE INDEX "SupportStatusHistory_ticketId_createdAt_idx" ON "SupportStatusHistory" ("ticketId", "createdAt");
CREATE INDEX "SupportStatusHistory_actorUserId_createdAt_idx" ON "SupportStatusHistory" ("actorUserId", "createdAt");
CREATE INDEX "SupportEvent_ticketId_occurredAt_idx" ON "SupportEvent" ("ticketId", "occurredAt");
CREATE INDEX "SupportEvent_eventType_processedAt_idx" ON "SupportEvent" ("eventType", "processedAt");
ALTER TABLE "SupportSlaPolicy" ADD CONSTRAINT "SupportSlaPolicy_positive_minutes_check" CHECK ("firstResponseMinutes" > 0 AND "resolutionMinutes" > 0);
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_positive_size_check" CHECK ("sizeBytes" > 0);
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_nonempty_body_check" CHECK (length(btrim("body")) > 0);
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_nonempty_subject_check" CHECK (length(btrim("subject")) > 0);
CREATE OR REPLACE FUNCTION prevent_support_history_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% records are immutable', TG_TABLE_NAME; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SupportMessage_immutable" BEFORE UPDATE OR DELETE ON "SupportMessage" FOR EACH ROW EXECUTE FUNCTION prevent_support_history_mutation();
CREATE TRIGGER "SupportStatusHistory_immutable" BEFORE UPDATE OR DELETE ON "SupportStatusHistory" FOR EACH ROW EXECUTE FUNCTION prevent_support_history_mutation();
CREATE OR REPLACE FUNCTION prevent_support_ticket_delete() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Support tickets must be closed or archived, not deleted'; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SupportTicket_no_delete" BEFORE DELETE ON "SupportTicket" FOR EACH ROW EXECUTE FUNCTION prevent_support_ticket_delete();

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_company_origin_requires_company_check" CHECK ("createdFrom" <> 'COMPANY' OR "requesterCompanyId" IS NOT NULL);
CREATE UNIQUE INDEX "SupportSlaPolicy_one_active_global_per_priority_idx" ON "SupportSlaPolicy" ("priority") WHERE "categoryId" IS NULL AND "isActive" = true;
