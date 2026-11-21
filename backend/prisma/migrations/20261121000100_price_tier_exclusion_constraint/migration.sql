-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- AddExclusionConstraint
-- Prevent overlapping minQuantity/maxQuantity ranges per product
-- maxQuantity = NULL means infinity
ALTER TABLE "ProductPriceTier"
ADD CONSTRAINT "ProductPriceTier_no_overlapping_ranges"
EXCLUDE USING gist (
  "productId" WITH =,
  int4range("minQuantity", COALESCE("maxQuantity", 2147483647), '[]') WITH &&
);