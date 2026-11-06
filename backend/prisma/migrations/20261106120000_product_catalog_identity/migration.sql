-- Shared product identity across independent supplier listings.
ALTER TABLE "Product" ADD COLUMN "catalogCode" TEXT;
CREATE INDEX "Product_catalogCode_idx" ON "Product"("catalogCode");
