-- Restore the FAQ and static-page tables required by the existing CMS services and admin screens.
-- Additive only: no existing content or marketplace data is modified.

CREATE TABLE "Faq" (
  "id" SERIAL NOT NULL,
  "question" VARCHAR(500) NOT NULL,
  "answer" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL DEFAULT 'عمومی',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Faq_question_key" UNIQUE ("question")
);

CREATE TABLE "Page" (
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
  CONSTRAINT "Page_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Page_slug_key" UNIQUE ("slug")
);

CREATE INDEX "Faq_category_sortOrder_idx" ON "Faq" ("category", "sortOrder");
CREATE INDEX "Faq_isActive_idx" ON "Faq" ("isActive");
CREATE INDEX "Page_isActive_idx" ON "Page" ("isActive");

COMMENT ON TABLE "Faq" IS 'پرسش‌های متداول قابل انتشار در وب‌سایت و مدیریت در CMS';
COMMENT ON COLUMN "Faq"."question" IS 'متن پرسش متداول؛ مقدار یکتا';
COMMENT ON COLUMN "Faq"."answer" IS 'پاسخ کامل پرسش متداول';
COMMENT ON TABLE "Page" IS 'صفحات ثابت و محتوای حقوقی/معرفی قابل مدیریت در CMS';
COMMENT ON COLUMN "Page"."slug" IS 'شناسه متنی یکتا برای URL صفحه';
COMMENT ON COLUMN "Page"."content" IS 'محتوای صفحه با قالب مشخص‌شده در contentFormat';
