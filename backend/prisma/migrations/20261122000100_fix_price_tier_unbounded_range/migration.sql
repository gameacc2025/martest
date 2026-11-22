-- Fix the unbounded upper quantity range without overflowing int4.
-- maxQuantity NULL means an unbounded upper range. int8range can represent
-- the exclusive successor of the largest Prisma Int when using inclusive
-- bounds, while preserving the application's Int columns and API contract.
ALTER TABLE "ProductPriceTier"
DROP CONSTRAINT IF EXISTS "ProductPriceTier_no_overlapping_ranges";

ALTER TABLE "ProductPriceTier"
ADD CONSTRAINT "ProductPriceTier_no_overlapping_ranges"
EXCLUDE USING gist (
  "productId" WITH =,
  int8range("minQuantity"::bigint, "maxQuantity"::bigint, '[]') WITH &&
);
