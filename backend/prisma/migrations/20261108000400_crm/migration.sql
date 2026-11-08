-- Additive migration; existing core tables and records are preserved.
CREATE TYPE "CRMAccountType" AS ENUM ('PROSPECT', 'CUSTOMER', 'PARTNER');
CREATE TYPE "CRMLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISQUALIFIED', 'DUPLICATE', 'LOST');
CREATE TYPE "CRMOpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'ON_HOLD');
CREATE TYPE "CRMActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'OTHER');
CREATE TYPE "CRMTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CRMTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "CRMNoteVisibility" AS ENUM ('TEAM', 'PRIVATE');
CREATE TABLE "CRMAccount" (
  "id" SERIAL NOT NULL,
  "accountType" "CRMAccountType" NOT NULL DEFAULT 'PROSPECT'::"CRMAccountType",
  "displayName" VARCHAR(240) NOT NULL,
  "companyId" INTEGER,
  "userId" INTEGER,
  "ownerUserId" INTEGER NOT NULL,
  "lifecycle" VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  "source" VARCHAR(100),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CRMAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CRMAccount_companyId_key" UNIQUE ("companyId"),
  CONSTRAINT "CRMAccount_userId_key" UNIQUE ("userId")
);

CREATE TABLE "CRMContact" (
  "id" SERIAL NOT NULL,
  "accountId" INTEGER NOT NULL,
  "userId" INTEGER,
  "name" VARCHAR(200) NOT NULL,
  "title" VARCHAR(120),
  "email" VARCHAR(320),
  "phone" VARCHAR(40),
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CRMContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadSource" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeadSource_code_key" UNIQUE ("code")
);

CREATE TABLE "Lead" (
  "id" SERIAL NOT NULL,
  "leadNumber" VARCHAR(32) NOT NULL,
  "displayName" VARCHAR(240) NOT NULL,
  "companyName" VARCHAR(240),
  "email" VARCHAR(320),
  "phone" VARCHAR(40),
  "sourceId" INTEGER,
  "status" "CRMLeadStatus" NOT NULL DEFAULT 'NEW'::"CRMLeadStatus",
  "score" INTEGER NOT NULL DEFAULT 0,
  "ownerUserId" INTEGER NOT NULL,
  "convertedAccountId" INTEGER,
  "convertedByUserId" INTEGER,
  "convertedAt" TIMESTAMP(3),
  "disqualifiedReason" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Lead_leadNumber_key" UNIQUE ("leadNumber")
);

CREATE TABLE "Pipeline" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PipelineStage" (
  "id" SERIAL NOT NULL,
  "pipelineId" INTEGER NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "probability" INTEGER NOT NULL DEFAULT 0,
  "isWon" BOOLEAN NOT NULL DEFAULT false,
  "isLost" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_id_pipelineId_key" UNIQUE ("id", "pipelineId");

CREATE TABLE "Opportunity" (
  "id" SERIAL NOT NULL,
  "opportunityNumber" VARCHAR(32) NOT NULL,
  "accountId" INTEGER NOT NULL,
  "pipelineId" INTEGER NOT NULL,
  "stageId" INTEGER NOT NULL,
  "ownerUserId" INTEGER NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'IRR',
  "expectedCloseAt" TIMESTAMP(3),
  "status" "CRMOpportunityStatus" NOT NULL DEFAULT 'OPEN'::"CRMOpportunityStatus",
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Opportunity_opportunityNumber_key" UNIQUE ("opportunityNumber")
);

CREATE TABLE "OpportunityStageHistory" (
  "id" SERIAL NOT NULL,
  "opportunityId" INTEGER NOT NULL,
  "fromStageId" INTEGER,
  "toStageId" INTEGER NOT NULL,
  "actorUserId" INTEGER NOT NULL,
  "reason" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpportunityStageHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CRMActivity" (
  "id" BIGSERIAL NOT NULL,
  "type" "CRMActivityType" NOT NULL,
  "subject" VARCHAR(240) NOT NULL,
  "body" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "durationMinutes" INTEGER,
  "outcome" VARCHAR(500),
  "actorUserId" INTEGER NOT NULL,
  "accountId" INTEGER,
  "leadId" INTEGER,
  "opportunityId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CRMActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CRMTask" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "description" TEXT,
  "status" "CRMTaskStatus" NOT NULL DEFAULT 'OPEN'::"CRMTaskStatus",
  "priority" "CRMTaskPriority" NOT NULL DEFAULT 'NORMAL'::"CRMTaskPriority",
  "assigneeUserId" INTEGER NOT NULL,
  "createdByUserId" INTEGER NOT NULL,
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "accountId" INTEGER,
  "leadId" INTEGER,
  "opportunityId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CRMTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CRMNote" (
  "id" BIGSERIAL NOT NULL,
  "body" TEXT NOT NULL,
  "visibility" "CRMNoteVisibility" NOT NULL DEFAULT 'TEAM'::"CRMNoteVisibility",
  "authorUserId" INTEGER NOT NULL,
  "accountId" INTEGER,
  "leadId" INTEGER,
  "opportunityId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CRMNote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CRMAccount" ADD CONSTRAINT "CRMAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CRMAccount" ADD CONSTRAINT "CRMAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CRMAccount" ADD CONSTRAINT "CRMAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CRMContact" ADD CONSTRAINT "CRMContact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CRMAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMContact" ADD CONSTRAINT "CRMContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedAccountId_fkey" FOREIGN KEY ("convertedAccountId") REFERENCES "CRMAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedByUserId_fkey" FOREIGN KEY ("convertedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CRMAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_stageId_pipelineId_fkey" FOREIGN KEY ("stageId", "pipelineId") REFERENCES "PipelineStage" ("id", "pipelineId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "PipelineStage" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CRMAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CRMAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMNote" ADD CONSTRAINT "CRMNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CRMNote" ADD CONSTRAINT "CRMNote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CRMAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMNote" ADD CONSTRAINT "CRMNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CRMNote" ADD CONSTRAINT "CRMNote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "CRMAccount_ownerUserId_updatedAt_idx" ON "CRMAccount" ("ownerUserId", "updatedAt");
CREATE INDEX "CRMAccount_accountType_lifecycle_idx" ON "CRMAccount" ("accountType", "lifecycle");
CREATE INDEX "CRMAccount_displayName_idx" ON "CRMAccount" ("displayName");
CREATE INDEX "CRMContact_accountId_isPrimary_idx" ON "CRMContact" ("accountId", "isPrimary");
CREATE INDEX "CRMContact_email_idx" ON "CRMContact" ("email");
CREATE INDEX "CRMContact_phone_idx" ON "CRMContact" ("phone");
CREATE INDEX "LeadSource_isActive_sortOrder_idx" ON "LeadSource" ("isActive", "sortOrder");
CREATE INDEX "Lead_ownerUserId_status_updatedAt_idx" ON "Lead" ("ownerUserId", "status", "updatedAt");
CREATE INDEX "Lead_sourceId_createdAt_idx" ON "Lead" ("sourceId", "createdAt");
CREATE INDEX "Lead_status_score_idx" ON "Lead" ("status", "score");
CREATE INDEX "Lead_phone_idx" ON "Lead" ("phone");
CREATE INDEX "Lead_email_idx" ON "Lead" ("email");
CREATE INDEX "Pipeline_isActive_isDefault_idx" ON "Pipeline" ("isActive", "isDefault");
CREATE UNIQUE INDEX "PipelineStage_pipelineId_code_key" ON "PipelineStage" ("pipelineId", "code");
CREATE UNIQUE INDEX "PipelineStage_pipelineId_sortOrder_key" ON "PipelineStage" ("pipelineId", "sortOrder");
CREATE INDEX "PipelineStage_pipelineId_isWon_isLost_idx" ON "PipelineStage" ("pipelineId", "isWon", "isLost");
CREATE INDEX "Opportunity_accountId_status_idx" ON "Opportunity" ("accountId", "status");
CREATE INDEX "Opportunity_ownerUserId_status_expectedCloseAt_idx" ON "Opportunity" ("ownerUserId", "status", "expectedCloseAt");
CREATE INDEX "Opportunity_pipelineId_stageId_idx" ON "Opportunity" ("pipelineId", "stageId");
CREATE INDEX "Opportunity_status_expectedCloseAt_idx" ON "Opportunity" ("status", "expectedCloseAt");
CREATE INDEX "OpportunityStageHistory_opportunityId_createdAt_idx" ON "OpportunityStageHistory" ("opportunityId", "createdAt");
CREATE INDEX "OpportunityStageHistory_actorUserId_createdAt_idx" ON "OpportunityStageHistory" ("actorUserId", "createdAt");
CREATE INDEX "CRMActivity_accountId_occurredAt_idx" ON "CRMActivity" ("accountId", "occurredAt");
CREATE INDEX "CRMActivity_leadId_occurredAt_idx" ON "CRMActivity" ("leadId", "occurredAt");
CREATE INDEX "CRMActivity_opportunityId_occurredAt_idx" ON "CRMActivity" ("opportunityId", "occurredAt");
CREATE INDEX "CRMActivity_actorUserId_occurredAt_idx" ON "CRMActivity" ("actorUserId", "occurredAt");
CREATE INDEX "CRMTask_assigneeUserId_status_dueAt_idx" ON "CRMTask" ("assigneeUserId", "status", "dueAt");
CREATE INDEX "CRMTask_createdByUserId_createdAt_idx" ON "CRMTask" ("createdByUserId", "createdAt");
CREATE INDEX "CRMTask_accountId_status_idx" ON "CRMTask" ("accountId", "status");
CREATE INDEX "CRMTask_leadId_status_idx" ON "CRMTask" ("leadId", "status");
CREATE INDEX "CRMTask_opportunityId_status_idx" ON "CRMTask" ("opportunityId", "status");
CREATE INDEX "CRMNote_accountId_createdAt_idx" ON "CRMNote" ("accountId", "createdAt");
CREATE INDEX "CRMNote_leadId_createdAt_idx" ON "CRMNote" ("leadId", "createdAt");
CREATE INDEX "CRMNote_opportunityId_createdAt_idx" ON "CRMNote" ("opportunityId", "createdAt");
CREATE INDEX "CRMNote_authorUserId_createdAt_idx" ON "CRMNote" ("authorUserId", "createdAt");
ALTER TABLE "CRMAccount" ADD CONSTRAINT "CRMAccount_single_canonical_identity_check" CHECK (NOT ("companyId" IS NOT NULL AND "userId" IS NOT NULL));
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_score_range_check" CHECK ("score" BETWEEN 0 AND 100);
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_amount_nonnegative_check" CHECK ("amount" >= 0);
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_probability_range_check" CHECK ("probability" BETWEEN 0 AND 100);
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_at_most_one_parent_check" CHECK (("accountId" IS NOT NULL)::int + ("leadId" IS NOT NULL)::int + ("opportunityId" IS NOT NULL)::int <= 1);
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_at_most_one_parent_check" CHECK (("accountId" IS NOT NULL)::int + ("leadId" IS NOT NULL)::int + ("opportunityId" IS NOT NULL)::int <= 1);
ALTER TABLE "CRMNote" ADD CONSTRAINT "CRMNote_at_most_one_parent_check" CHECK (("accountId" IS NOT NULL)::int + ("leadId" IS NOT NULL)::int + ("opportunityId" IS NOT NULL)::int <= 1);
CREATE UNIQUE INDEX "Pipeline_single_default_idx" ON "Pipeline" ("isDefault") WHERE "isDefault" = true;
CREATE OR REPLACE FUNCTION prevent_opportunity_history_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Opportunity stage history is immutable'; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "OpportunityStageHistory_immutable" BEFORE UPDATE OR DELETE ON "OpportunityStageHistory" FOR EACH ROW EXECUTE FUNCTION prevent_opportunity_history_mutation();
