-- Persist immutable price-change observations for truthful product price history.
CREATE TABLE "ProductPriceSnapshot" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "priceTierId" INTEGER,
  "minQuantity" INTEGER NOT NULL,
  "maxQuantity" INTEGER,
  "price" DECIMAL(18,2) NOT NULL,
  "unit" TEXT,
  "action" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductPriceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductPriceSnapshot_productId_recordedAt_idx"
  ON "ProductPriceSnapshot"("productId", "recordedAt");
CREATE INDEX "ProductPriceSnapshot_priceTierId_idx"
  ON "ProductPriceSnapshot"("priceTierId");

ALTER TABLE "ProductPriceSnapshot"
  ADD CONSTRAINT "ProductPriceSnapshot_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
