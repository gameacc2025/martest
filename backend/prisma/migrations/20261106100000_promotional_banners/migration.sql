CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "Banner" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" VARCHAR(300),
  "imageUrl" TEXT NOT NULL,
  "targetUrl" TEXT,
  "ctaLabel" VARCHAR(40),
  "placement" VARCHAR(40) NOT NULL DEFAULT 'HOME_HERO',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "BannerStatus" NOT NULL DEFAULT 'DRAFT',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Banner_placement_status_isActive_sortOrder_idx"
  ON "Banner"("placement", "status", "isActive", "sortOrder");
CREATE INDEX "Banner_startsAt_endsAt_idx"
  ON "Banner"("startsAt", "endsAt");
CREATE INDEX "Banner_deletedAt_idx"
  ON "Banner"("deletedAt");
