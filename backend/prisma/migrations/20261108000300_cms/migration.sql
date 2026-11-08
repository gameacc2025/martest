-- Additive migration; existing core tables and records are preserved.
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ArticleType" AS ENUM ('NEWS', 'ARTICLE', 'GUIDE');
CREATE TABLE "Article" (
  "id" SERIAL NOT NULL,
  "slug" VARCHAR(220) NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "excerpt" VARCHAR(600),
  "content" TEXT NOT NULL,
  "contentFormat" VARCHAR(20) NOT NULL DEFAULT 'HTML',
  "type" "ArticleType" NOT NULL DEFAULT 'ARTICLE'::"ArticleType",
  "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT'::"ArticleStatus",
  "coverImageKey" VARCHAR(500),
  "authorUserId" INTEGER NOT NULL,
  "publishedByUserId" INTEGER,
  "publishedAt" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "metaTitle" VARCHAR(240),
  "metaDescription" VARCHAR(500),
  "canonicalUrl" VARCHAR(500),
  "isIndexable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Article_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Article_slug_key" UNIQUE ("slug")
);

CREATE TABLE "ArticleCategory" (
  "id" SERIAL NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArticleCategory_slug_key" UNIQUE ("slug")
);

CREATE TABLE "ArticleTag" (
  "id" SERIAL NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArticleTag_slug_key" UNIQUE ("slug")
);

CREATE TABLE "ArticleCategoryAssignment" (
  "articleId" INTEGER NOT NULL,
  "categoryId" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ArticleCategoryAssignment_pkey" PRIMARY KEY ("articleId", "categoryId")
);

CREATE TABLE "ArticleTagAssignment" (
  "articleId" INTEGER NOT NULL,
  "tagId" INTEGER NOT NULL,
  CONSTRAINT "ArticleTagAssignment_pkey" PRIMARY KEY ("articleId", "tagId")
);

CREATE TABLE "ArticleRevision" (
  "id" BIGSERIAL NOT NULL,
  "articleId" INTEGER NOT NULL,
  "editorUserId" INTEGER NOT NULL,
  "revisionNo" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "changeNote" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArticleMedia" (
  "id" SERIAL NOT NULL,
  "articleId" INTEGER NOT NULL,
  "uploadedByUserId" INTEGER NOT NULL,
  "storageKey" VARCHAR(500) NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(150) NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "altText" VARCHAR(300),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArticleMedia_storageKey_key" UNIQUE ("storageKey")
);

ALTER TABLE "Article" ADD CONSTRAINT "Article_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleCategoryAssignment" ADD CONSTRAINT "ArticleCategoryAssignment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleCategoryAssignment" ADD CONSTRAINT "ArticleCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTagAssignment" ADD CONSTRAINT "ArticleTagAssignment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTagAssignment" ADD CONSTRAINT "ArticleTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ArticleTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_editorUserId_fkey" FOREIGN KEY ("editorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Article_status_publishedAt_idx" ON "Article" ("status", "publishedAt");
CREATE INDEX "Article_type_status_publishedAt_idx" ON "Article" ("type", "status", "publishedAt");
CREATE INDEX "Article_authorUserId_updatedAt_idx" ON "Article" ("authorUserId", "updatedAt");
CREATE INDEX "Article_scheduledAt_idx" ON "Article" ("scheduledAt");
CREATE INDEX "ArticleCategory_isActive_sortOrder_idx" ON "ArticleCategory" ("isActive", "sortOrder");
CREATE INDEX "ArticleCategoryAssignment_categoryId_sortOrder_idx" ON "ArticleCategoryAssignment" ("categoryId", "sortOrder");
CREATE INDEX "ArticleTagAssignment_tagId_idx" ON "ArticleTagAssignment" ("tagId");
CREATE UNIQUE INDEX "ArticleRevision_articleId_revisionNo_key" ON "ArticleRevision" ("articleId", "revisionNo");
CREATE INDEX "ArticleRevision_articleId_createdAt_idx" ON "ArticleRevision" ("articleId", "createdAt");
CREATE INDEX "ArticleRevision_editorUserId_createdAt_idx" ON "ArticleRevision" ("editorUserId", "createdAt");
CREATE INDEX "ArticleMedia_articleId_createdAt_idx" ON "ArticleMedia" ("articleId", "createdAt");
CREATE INDEX "ArticleMedia_uploadedByUserId_idx" ON "ArticleMedia" ("uploadedByUserId");
ALTER TABLE "Article" ADD CONSTRAINT "Article_published_requires_timestamp_check" CHECK ("status" <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "Article" ADD CONSTRAINT "Article_scheduled_requires_timestamp_check" CHECK ("status" <> 'SCHEDULED' OR "scheduledAt" IS NOT NULL);
ALTER TABLE "Article" ADD CONSTRAINT "Article_nonempty_title_check" CHECK (length(btrim("title")) > 0);
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_positive_revision_check" CHECK ("revisionNo" > 0);
CREATE OR REPLACE FUNCTION prevent_article_revision_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Article revisions are immutable'; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "ArticleRevision_immutable" BEFORE UPDATE OR DELETE ON "ArticleRevision" FOR EACH ROW EXECUTE FUNCTION prevent_article_revision_mutation();
