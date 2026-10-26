-- Customer-owned delivery/contact addresses.
CREATE TABLE "Address" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'خانه',
  "recipientName" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "postalCode" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");

ALTER TABLE "Address"
  ADD CONSTRAINT "Address_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
