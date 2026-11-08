-- Additive migration; existing core tables and records are preserved.
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');
CREATE TYPE "CommissionCalculationType" AS ENUM ('PERCENTAGE', 'FIXED_PER_ORDER');
CREATE TYPE "SellerPayableStatus" AS ENUM ('PENDING', 'ON_HOLD', 'ELIGIBLE', 'INCLUDED_IN_SETTLEMENT', 'PAID', 'REVERSED');
CREATE TYPE "SettlementApprovalDecision" AS ENUM ('APPROVE', 'REJECT', 'RETURN_FOR_REVISION');
CREATE TYPE "SettlementStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PAYOUT_PENDING', 'PAID', 'RECONCILED', 'ON_HOLD', 'REJECTED', 'PAYOUT_FAILED', 'ADJUSTED');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOID');
CREATE TABLE "LedgerAccount" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "accountType" "LedgerAccountType" NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LedgerAccount_code_key" UNIQUE ("code")
);

CREATE TABLE "JournalEntry" (
  "id" BIGSERIAL NOT NULL,
  "entryNumber" VARCHAR(48) NOT NULL,
  "sourceType" VARCHAR(80),
  "sourceId" VARCHAR(120),
  "currency" VARCHAR(3) NOT NULL,
  "description" VARCHAR(1000),
  "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT'::"JournalEntryStatus",
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postedAt" TIMESTAMP(3),
  "createdByUserId" INTEGER,
  "reversalOfId" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JournalEntry_entryNumber_key" UNIQUE ("entryNumber"),
  CONSTRAINT "JournalEntry_reversalOfId_key" UNIQUE ("reversalOfId")
);

CREATE TABLE "JournalLine" (
  "id" BIGSERIAL NOT NULL,
  "journalEntryId" BIGINT NOT NULL,
  "accountId" INTEGER NOT NULL,
  "debit" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "credit" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "memo" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommissionRule" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "calculation" "CommissionCalculationType" NOT NULL,
  "rate" DECIMAL(12, 6) NOT NULL,
  "currency" VARCHAR(3),
  "companyId" INTEGER,
  "categoryId" INTEGER,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommissionRule_code_key" UNIQUE ("code")
);

CREATE TABLE "CommissionSnapshot" (
  "id" SERIAL NOT NULL,
  "sellerOrderId" INTEGER NOT NULL,
  "ruleId" INTEGER,
  "calculation" "CommissionCalculationType" NOT NULL,
  "rate" DECIMAL(12, 6) NOT NULL,
  "baseAmount" DECIMAL(20, 2) NOT NULL,
  "commissionAmount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommissionSnapshot_sellerOrderId_key" UNIQUE ("sellerOrderId")
);

CREATE TABLE "SellerPayable" (
  "id" BIGSERIAL NOT NULL,
  "sellerOrderId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "settlementId" INTEGER,
  "currency" VARCHAR(3) NOT NULL,
  "grossAmount" DECIMAL(20, 2) NOT NULL,
  "commissionAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "deductionAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "netAmount" DECIMAL(20, 2) NOT NULL,
  "status" "SellerPayableStatus" NOT NULL DEFAULT 'PENDING'::"SellerPayableStatus",
  "eligibleAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerPayable_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerPayable_sellerOrderId_key" UNIQUE ("sellerOrderId")
);

CREATE TABLE "Settlement" (
  "id" SERIAL NOT NULL,
  "settlementNumber" VARCHAR(48) NOT NULL,
  "companyId" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "grossAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "deductionAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "netAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "status" "SettlementStatus" NOT NULL DEFAULT 'REQUESTED'::"SettlementStatus",
  "requestedByUserId" INTEGER NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Settlement_settlementNumber_key" UNIQUE ("settlementNumber")
);

CREATE TABLE "SettlementApproval" (
  "id" SERIAL NOT NULL,
  "settlementId" INTEGER NOT NULL,
  "approverUserId" INTEGER NOT NULL,
  "decision" "SettlementApprovalDecision" NOT NULL,
  "reason" VARCHAR(1000),
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SettlementApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SettlementPayout" (
  "id" SERIAL NOT NULL,
  "settlementId" INTEGER NOT NULL,
  "provider" VARCHAR(80),
  "providerReference" VARCHAR(200),
  "amount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING'::"PayoutStatus",
  "idempotencyKey" VARCHAR(160) NOT NULL,
  "executedByUserId" INTEGER,
  "executedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SettlementPayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SettlementPayout_providerReference_key" UNIQUE ("providerReference"),
  CONSTRAINT "SettlementPayout_idempotencyKey_key" UNIQUE ("idempotencyKey")
);

CREATE TABLE "ReconciliationRecord" (
  "id" BIGSERIAL NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "externalReference" VARCHAR(240) NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "matched" BOOLEAN NOT NULL DEFAULT false,
  "paymentTransactionId" INTEGER,
  "payoutId" INTEGER,
  "notes" TEXT,
  "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReconciliationRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceInvoice" (
  "id" SERIAL NOT NULL,
  "invoiceNumber" VARCHAR(48) NOT NULL,
  "companyId" INTEGER,
  "buyerUserId" INTEGER,
  "orderId" INTEGER,
  "sellerOrderId" INTEGER,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT'::"InvoiceStatus",
  "currency" VARCHAR(3) NOT NULL,
  "subtotal" DECIMAL(20, 2) NOT NULL,
  "taxTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(20, 2) NOT NULL,
  "issuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceInvoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinanceInvoice_invoiceNumber_key" UNIQUE ("invoiceNumber")
);

CREATE TABLE "FinanceInvoiceLine" (
  "id" SERIAL NOT NULL,
  "invoiceId" INTEGER NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "quantity" DECIMAL(18, 4) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(20, 2) NOT NULL,
  "taxAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "lineTotal" DECIMAL(20, 2) NOT NULL,
  CONSTRAINT "FinanceInvoiceLine_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionSnapshot" ADD CONSTRAINT "CommissionSnapshot_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionSnapshot" ADD CONSTRAINT "CommissionSnapshot_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CommissionRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SellerPayable" ADD CONSTRAINT "SellerPayable_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerPayable" ADD CONSTRAINT "SellerPayable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerPayable" ADD CONSTRAINT "SellerPayable_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementApproval" ADD CONSTRAINT "SettlementApproval_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementApproval" ADD CONSTRAINT "SettlementApproval_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementPayout" ADD CONSTRAINT "SettlementPayout_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementPayout" ADD CONSTRAINT "SettlementPayout_executedByUserId_fkey" FOREIGN KEY ("executedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReconciliationRecord" ADD CONSTRAINT "ReconciliationRecord_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReconciliationRecord" ADD CONSTRAINT "ReconciliationRecord_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SettlementPayout" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceInvoiceLine" ADD CONSTRAINT "FinanceInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinanceInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "LedgerAccount_accountType_currency_isActive_idx" ON "LedgerAccount" ("accountType", "currency", "isActive");
CREATE INDEX "JournalEntry_sourceType_sourceId_idx" ON "JournalEntry" ("sourceType", "sourceId");
CREATE INDEX "JournalEntry_status_occurredAt_idx" ON "JournalEntry" ("status", "occurredAt");
CREATE INDEX "JournalEntry_currency_postedAt_idx" ON "JournalEntry" ("currency", "postedAt");
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine" ("journalEntryId");
CREATE INDEX "JournalLine_accountId_createdAt_idx" ON "JournalLine" ("accountId", "createdAt");
CREATE INDEX "CommissionRule_isActive_validFrom_validTo_priority_idx" ON "CommissionRule" ("isActive", "validFrom", "validTo", "priority");
CREATE INDEX "CommissionRule_companyId_categoryId_idx" ON "CommissionRule" ("companyId", "categoryId");
CREATE INDEX "SellerPayable_companyId_status_eligibleAt_idx" ON "SellerPayable" ("companyId", "status", "eligibleAt");
CREATE INDEX "SellerPayable_settlementId_idx" ON "SellerPayable" ("settlementId");
CREATE INDEX "Settlement_companyId_status_createdAt_idx" ON "Settlement" ("companyId", "status", "createdAt");
CREATE INDEX "Settlement_status_requestedAt_idx" ON "Settlement" ("status", "requestedAt");
CREATE INDEX "Settlement_periodStart_periodEnd_idx" ON "Settlement" ("periodStart", "periodEnd");
CREATE INDEX "SettlementApproval_settlementId_decidedAt_idx" ON "SettlementApproval" ("settlementId", "decidedAt");
CREATE INDEX "SettlementApproval_approverUserId_decidedAt_idx" ON "SettlementApproval" ("approverUserId", "decidedAt");
CREATE INDEX "SettlementPayout_settlementId_createdAt_idx" ON "SettlementPayout" ("settlementId", "createdAt");
CREATE INDEX "SettlementPayout_status_createdAt_idx" ON "SettlementPayout" ("status", "createdAt");
CREATE UNIQUE INDEX "ReconciliationRecord_provider_externalReference_key" ON "ReconciliationRecord" ("provider", "externalReference");
CREATE INDEX "ReconciliationRecord_matched_reconciledAt_idx" ON "ReconciliationRecord" ("matched", "reconciledAt");
CREATE INDEX "ReconciliationRecord_paymentTransactionId_idx" ON "ReconciliationRecord" ("paymentTransactionId");
CREATE INDEX "ReconciliationRecord_payoutId_idx" ON "ReconciliationRecord" ("payoutId");
CREATE INDEX "FinanceInvoice_companyId_createdAt_idx" ON "FinanceInvoice" ("companyId", "createdAt");
CREATE INDEX "FinanceInvoice_buyerUserId_createdAt_idx" ON "FinanceInvoice" ("buyerUserId", "createdAt");
CREATE INDEX "FinanceInvoice_orderId_idx" ON "FinanceInvoice" ("orderId");
CREATE INDEX "FinanceInvoice_sellerOrderId_idx" ON "FinanceInvoice" ("sellerOrderId");
CREATE INDEX "FinanceInvoiceLine_invoiceId_idx" ON "FinanceInvoiceLine" ("invoiceId");
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_one_sided_nonnegative_check" CHECK ("debit" >= 0 AND "credit" >= 0 AND (("debit" > 0 AND "credit" = 0) OR ("credit" > 0 AND "debit" = 0)));
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_rate_check" CHECK ("rate" >= 0 AND ("calculation" <> 'PERCENTAGE' OR "rate" <= 100) AND ("calculation" <> 'FIXED_PER_ORDER' OR "currency" IS NOT NULL));
ALTER TABLE "SellerPayable" ADD CONSTRAINT "SellerPayable_amounts_check" CHECK ("grossAmount" >= 0 AND "commissionAmount" >= 0 AND "deductionAmount" >= 0 AND "netAmount" >= 0 AND "netAmount" = "grossAmount" - "commissionAmount" - "deductionAmount");
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_period_check" CHECK ("periodEnd" > "periodStart" AND "grossAmount" >= 0 AND "deductionAmount" >= 0 AND "netAmount" >= 0 AND "netAmount" = "grossAmount" - "deductionAmount");
ALTER TABLE "SettlementPayout" ADD CONSTRAINT "SettlementPayout_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "ReconciliationRecord" ADD CONSTRAINT "ReconciliationRecord_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_single_recipient_check" CHECK (("companyId" IS NOT NULL)::int + ("buyerUserId" IS NOT NULL)::int = 1);
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_single_source_check" CHECK (("orderId" IS NOT NULL)::int + ("sellerOrderId" IS NOT NULL)::int = 1);
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_amounts_check" CHECK ("subtotal" >= 0 AND "taxTotal" >= 0 AND "grandTotal" = "subtotal" + "taxTotal");
ALTER TABLE "FinanceInvoiceLine" ADD CONSTRAINT "FinanceInvoiceLine_amount_quantity_check" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "taxAmount" >= 0 AND "lineTotal" = ("quantity" * "unitPrice") + "taxAmount");
CREATE OR REPLACE FUNCTION guard_posted_journal_entry() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."status" IN ('POSTED', 'REVERSED') THEN RAISE EXCEPTION 'Posted journal entries are immutable'; END IF;
  IF TG_OP = 'UPDATE' AND OLD."status" = 'POSTED' AND NEW."status" = 'REVERSED'
     AND (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD."status" IN ('POSTED', 'REVERSED') THEN RAISE EXCEPTION 'Posted journal entries are immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "JournalEntry_immutable_after_posting" BEFORE UPDATE OR DELETE ON "JournalEntry" FOR EACH ROW EXECUTE FUNCTION guard_posted_journal_entry();
CREATE OR REPLACE FUNCTION guard_posted_journal_line() RETURNS trigger AS $$
DECLARE entry_id BIGINT; entry_status "JournalEntryStatus";
BEGIN
  IF TG_OP = 'DELETE' THEN entry_id := OLD."journalEntryId"; ELSE entry_id := NEW."journalEntryId"; END IF;
  SELECT "status" INTO entry_status FROM "JournalEntry" WHERE "id" = entry_id;
  IF entry_status IS DISTINCT FROM 'DRAFT' THEN RAISE EXCEPTION 'Journal lines can only be changed while the journal entry is DRAFT'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "JournalLine_draft_only" BEFORE INSERT OR UPDATE OR DELETE ON "JournalLine" FOR EACH ROW EXECUTE FUNCTION guard_posted_journal_line();
CREATE OR REPLACE FUNCTION validate_posted_journal_balance() RETURNS trigger AS $$
DECLARE target_id BIGINT; entry_status "JournalEntryStatus"; line_count BIGINT; total_debit NUMERIC(20,2); total_credit NUMERIC(20,2); wrong_currency BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'JournalEntry' THEN target_id := NEW."id"; ELSE
    IF TG_OP = 'DELETE' THEN target_id := OLD."journalEntryId"; ELSE target_id := NEW."journalEntryId"; END IF;
  END IF;
  SELECT "status" INTO entry_status FROM "JournalEntry" WHERE "id" = target_id;
  IF entry_status = 'POSTED' THEN
    SELECT COUNT(*), COALESCE(SUM(l."debit"),0), COALESCE(SUM(l."credit"),0),
      COUNT(*) FILTER (WHERE a."currency" <> (SELECT "currency" FROM "JournalEntry" WHERE "id" = target_id))
      INTO line_count, total_debit, total_credit, wrong_currency
      FROM "JournalLine" l JOIN "LedgerAccount" a ON a."id" = l."accountId" WHERE l."journalEntryId" = target_id;
    IF line_count < 2 OR total_debit <> total_credit OR wrong_currency > 0 THEN
      RAISE EXCEPTION 'Posted journal entry % must have at least two balanced lines in the entry currency', target_id;
    END IF;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER "JournalLine_balance_deferred" AFTER INSERT OR UPDATE OR DELETE ON "JournalLine" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_posted_journal_balance();
CREATE CONSTRAINT TRIGGER "JournalEntry_balance_deferred" AFTER INSERT OR UPDATE ON "JournalEntry" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_posted_journal_balance();
CREATE OR REPLACE FUNCTION enforce_settlement_maker_checker() RETURNS trigger AS $$
DECLARE requester INTEGER;
BEGIN
  SELECT "requestedByUserId" INTO requester FROM "Settlement" WHERE "id" = NEW."settlementId";
  IF requester IS NOT NULL AND requester = NEW."approverUserId" THEN RAISE EXCEPTION 'Settlement requester cannot approve their own settlement'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "SettlementApproval_maker_checker" BEFORE INSERT OR UPDATE ON "SettlementApproval" FOR EACH ROW EXECUTE FUNCTION enforce_settlement_maker_checker();
CREATE UNIQUE INDEX "JournalEntry_source_idempotency_idx" ON "JournalEntry" ("sourceType", "sourceId") WHERE "sourceType" IS NOT NULL AND "sourceId" IS NOT NULL;
CREATE OR REPLACE FUNCTION prevent_finance_history_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% records are immutable', TG_TABLE_NAME; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SettlementApproval_immutable" BEFORE UPDATE OR DELETE ON "SettlementApproval" FOR EACH ROW EXECUTE FUNCTION prevent_finance_history_mutation();
CREATE TRIGGER "ReconciliationRecord_immutable" BEFORE UPDATE OR DELETE ON "ReconciliationRecord" FOR EACH ROW EXECUTE FUNCTION prevent_finance_history_mutation();
CREATE OR REPLACE FUNCTION enforce_settlement_payout_controls() RETURNS trigger AS $$
DECLARE settlement_status "SettlementStatus"; requester INTEGER;
BEGIN
  SELECT "status", "requestedByUserId" INTO settlement_status, requester FROM "Settlement" WHERE "id" = NEW."settlementId";
  IF settlement_status NOT IN ('APPROVED', 'PAYOUT_PENDING') THEN RAISE EXCEPTION 'Settlement must be approved before payout'; END IF;
  IF NEW."executedByUserId" IS NOT NULL THEN
    IF NEW."executedByUserId" = requester THEN RAISE EXCEPTION 'Settlement requester cannot execute their own payout'; END IF;
    IF EXISTS (SELECT 1 FROM "SettlementApproval" a WHERE a."settlementId" = NEW."settlementId" AND a."decision" = 'APPROVE' AND a."approverUserId" = NEW."executedByUserId") THEN
      RAISE EXCEPTION 'Settlement approver cannot execute the payout';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SettlementPayout_maker_checker" BEFORE INSERT OR UPDATE ON "SettlementPayout" FOR EACH ROW EXECUTE FUNCTION enforce_settlement_payout_controls();

CREATE UNIQUE INDEX "SettlementApproval_settlementId_approverUserId_key" ON "SettlementApproval" ("settlementId", "approverUserId");
