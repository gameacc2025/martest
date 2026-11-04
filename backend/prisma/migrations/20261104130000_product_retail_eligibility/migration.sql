-- Retail sales are opt-in. Existing catalogue products must not become purchasable by default.
ALTER TABLE "Product"
ADD COLUMN "retailEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Product_retailEnabled_status_visibility_idx"
ON "Product" ("retailEnabled", "status", "visibility");
