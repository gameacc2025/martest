-- Cross-app session handoff (PKCE one-time code).
-- The admin/company panels open a session minted by the website without
-- any token ever travelling in a URL: a 60-second, single-use code bound
-- to base64url(SHA-256(verifier)) is exchanged for a fresh token pair.
-- See backend/src/modules/auth/handoff.service.js.

-- CreateTable
CREATE TABLE "HandoffCode" (
    "id" SERIAL NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "app" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoffCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HandoffCode_codeHash_key" ON "HandoffCode"("codeHash");
CREATE INDEX "HandoffCode_userId_idx" ON "HandoffCode"("userId");
CREATE INDEX "HandoffCode_expiresAt_idx" ON "HandoffCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "HandoffCode" ADD CONSTRAINT "HandoffCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
