-- Forward-only repair for Prisma models missing from the historical migration chain.
-- Safe for databases where these exact tables already exist (for example, prior db-push
-- development databases): tables and indexes are created conditionally; missing FKs are
-- added by name. This migration never drops or rewrites application data.

CREATE TABLE IF NOT EXISTS "Faq" (
  "id" SERIAL NOT NULL,
  "question" VARCHAR(500) NOT NULL,
  "answer" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL DEFAULT 'عمومی',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Faq_question_key" ON "Faq"("question");
CREATE INDEX IF NOT EXISTS "Faq_category_sortOrder_idx" ON "Faq"("category", "sortOrder");
CREATE INDEX IF NOT EXISTS "Faq_isActive_idx" ON "Faq"("isActive");

CREATE TABLE IF NOT EXISTS "Page" (
  "id" SERIAL NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "content" TEXT NOT NULL,
  "contentFormat" VARCHAR(20) NOT NULL DEFAULT 'HTML',
  "metaTitle" VARCHAR(240),
  "metaDescription" VARCHAR(500),
  "canonicalUrl" VARCHAR(500),
  "isIndexable" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");
CREATE INDEX IF NOT EXISTS "Page_isActive_idx" ON "Page"("isActive");

CREATE TABLE IF NOT EXISTS "LeadStatusHistory" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "previousStatus" "CRMLeadStatus",
  "newStatus" "CRMLeadStatus" NOT NULL,
  "actorUserId" INTEGER NOT NULL,
  "reason" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadStatusHistory_leadId_createdAt_idx" ON "LeadStatusHistory"("leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadStatusHistory_actorUserId_createdAt_idx" ON "LeadStatusHistory"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadStatusHistory_newStatus_createdAt_idx" ON "LeadStatusHistory"("newStatus", "createdAt");

CREATE TABLE IF NOT EXISTS "CRMFieldAudit" (
  "id" BIGSERIAL NOT NULL,
  "entityType" VARCHAR(60) NOT NULL,
  "entityId" VARCHAR(100) NOT NULL,
  "fieldName" VARCHAR(100) NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "actorUserId" INTEGER NOT NULL,
  "action" VARCHAR(60) NOT NULL,
  "requestId" VARCHAR(100),
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CRMFieldAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CRMFieldAudit_entityType_entityId_occurredAt_idx" ON "CRMFieldAudit"("entityType", "entityId", "occurredAt");
CREATE INDEX IF NOT EXISTS "CRMFieldAudit_actorUserId_occurredAt_idx" ON "CRMFieldAudit"("actorUserId", "occurredAt");
CREATE INDEX IF NOT EXISTS "CRMFieldAudit_fieldName_occurredAt_idx" ON "CRMFieldAudit"("fieldName", "occurredAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadStatusHistory_leadId_fkey' AND conrelid = '"LeadStatusHistory"'::regclass) THEN
    ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadStatusHistory_actorUserId_fkey' AND conrelid = '"LeadStatusHistory"'::regclass) THEN
    ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CRMFieldAudit_actorUserId_fkey' AND conrelid = '"CRMFieldAudit"'::regclass) THEN
    ALTER TABLE "CRMFieldAudit" ADD CONSTRAINT "CRMFieldAudit_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "Faq" IS 'پرسش‌های متداول قابل مدیریت و نمایش عمومی در وب‌سایت.';
COMMENT ON COLUMN "Faq"."id" IS 'شناسه یکتای رکورد و کلید اصلی جدول.';
COMMENT ON COLUMN "Faq"."question" IS 'متن پرسش؛ برای جلوگیری از رکورد تکراری یکتا است.';
COMMENT ON COLUMN "Faq"."answer" IS 'پاسخ کامل پرسش متداول.';
COMMENT ON COLUMN "Faq"."category" IS 'دسته‌بندی نمایشی پرسش.';
COMMENT ON COLUMN "Faq"."sortOrder" IS 'ترتیب نمایش در دسته‌بندی.';
COMMENT ON COLUMN "Faq"."isActive" IS 'فعال یا غیرفعال بودن برای نمایش عمومی.';
COMMENT ON COLUMN "Faq"."createdAt" IS 'زمان ایجاد رکورد.';
COMMENT ON COLUMN "Faq"."updatedAt" IS 'آخرین زمان ویرایش رکورد.';

COMMENT ON TABLE "Page" IS 'صفحات ثابت و محتوای حقوقی/معرفی قابل مدیریت در CMS.';
COMMENT ON COLUMN "Page"."id" IS 'شناسه یکتای رکورد و کلید اصلی جدول.';
COMMENT ON COLUMN "Page"."slug" IS 'شناسه متنی یکتا برای URL صفحه.';
COMMENT ON COLUMN "Page"."title" IS 'عنوان قابل نمایش صفحه.';
COMMENT ON COLUMN "Page"."content" IS 'محتوای صفحه.';
COMMENT ON COLUMN "Page"."contentFormat" IS 'قالب تفسیر محتوا.';
COMMENT ON COLUMN "Page"."metaTitle" IS 'عنوان SEO صفحه.';
COMMENT ON COLUMN "Page"."metaDescription" IS 'توضیح SEO صفحه.';
COMMENT ON COLUMN "Page"."canonicalUrl" IS 'نشانی canonical صفحه.';
COMMENT ON COLUMN "Page"."isIndexable" IS 'اجازه ایندکس‌شدن صفحه توسط موتورهای جست‌وجو.';
COMMENT ON COLUMN "Page"."isActive" IS 'فعال یا غیرفعال بودن صفحه.';
COMMENT ON COLUMN "Page"."createdAt" IS 'زمان ایجاد رکورد.';
COMMENT ON COLUMN "Page"."updatedAt" IS 'آخرین زمان ویرایش رکورد.';

COMMENT ON TABLE "LeadStatusHistory" IS 'تاریخچه تغییر وضعیت سرنخ فروش همراه با عامل و دلیل تغییر.';
COMMENT ON COLUMN "LeadStatusHistory"."id" IS 'شناسه یکتای رکورد و کلید اصلی جدول.';
COMMENT ON COLUMN "LeadStatusHistory"."leadId" IS 'شناسه سرنخ فروش مرتبط با این تاریخچه.';
COMMENT ON COLUMN "LeadStatusHistory"."previousStatus" IS 'وضعیت قبلی رکورد پیش از تغییر.';
COMMENT ON COLUMN "LeadStatusHistory"."newStatus" IS 'وضعیت جدید رکورد پس از تغییر.';
COMMENT ON COLUMN "LeadStatusHistory"."actorUserId" IS 'شناسه کاربر اجراکننده تغییر وضعیت.';
COMMENT ON COLUMN "LeadStatusHistory"."reason" IS 'دلیل تغییر وضعیت.';
COMMENT ON COLUMN "LeadStatusHistory"."createdAt" IS 'زمان ایجاد رکورد.';

COMMENT ON TABLE "CRMFieldAudit" IS 'ممیزی تغییرات فیلدهای حساس CRM برای پاسخ‌گویی و ممیزی تجاری.';
COMMENT ON COLUMN "CRMFieldAudit"."id" IS 'شناسه یکتای رکورد و کلید اصلی جدول.';
COMMENT ON COLUMN "CRMFieldAudit"."entityType" IS 'نوع موجودیت هدف عملیات ممیزی.';
COMMENT ON COLUMN "CRMFieldAudit"."entityId" IS 'شناسه رکورد هدف در موجودیت ثبت‌شده.';
COMMENT ON COLUMN "CRMFieldAudit"."fieldName" IS 'نام فیلد تغییر کرده.';
COMMENT ON COLUMN "CRMFieldAudit"."oldValue" IS 'مقدار قبلی فیلد به‌صورت JSON یا متن سریال‌شده.';
COMMENT ON COLUMN "CRMFieldAudit"."newValue" IS 'مقدار جدید فیلد به‌صورت JSON یا متن سریال‌شده.';
COMMENT ON COLUMN "CRMFieldAudit"."actorUserId" IS 'شناسه کاربر اجراکننده تغییر.';
COMMENT ON COLUMN "CRMFieldAudit"."action" IS 'نوع اقدام انجام‌شده.';
COMMENT ON COLUMN "CRMFieldAudit"."requestId" IS 'شناسه هم‌بستگی درخواست برای ردگیری در لاگ‌ها.';
COMMENT ON COLUMN "CRMFieldAudit"."occurredAt" IS 'زمان وقوع رویداد در منبع.';
