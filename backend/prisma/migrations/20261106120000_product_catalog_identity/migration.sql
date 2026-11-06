-- Shared product identity across independent supplier listings.
ALTER TABLE "Product" ADD COLUMN "catalogCode" TEXT;

-- Backfill existing English manufacturer/model pairs using the same
-- normalization as the application-level catalog-code generator.
UPDATE "Product"
SET "catalogCode" =
  'TEL-' ||
  trim(BOTH '-' FROM regexp_replace(upper(trim("brand")), '[^A-Z0-9]+', '-', 'g')) ||
  '-' ||
  trim(BOTH '-' FROM regexp_replace(upper(trim("model")), '[^A-Z0-9]+', '-', 'g'))
WHERE "catalogCode" IS NULL
  AND "brand" IS NOT NULL AND btrim("brand") <> ''
  AND "model" IS NOT NULL AND btrim("model") <> ''
  AND regexp_replace(upper(trim("brand")), '[^A-Z0-9]', '', 'g') <> ''
  AND regexp_replace(upper(trim("model")), '[^A-Z0-9]', '', 'g') <> '';

CREATE INDEX "Product_catalogCode_idx" ON "Product"("catalogCode");
