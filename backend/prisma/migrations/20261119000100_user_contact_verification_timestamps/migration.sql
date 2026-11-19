-- Persist verified contact ownership after a challenge is successfully consumed.
ALTER TABLE "User"
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

COMMENT ON COLUMN "User"."phoneVerifiedAt"
  IS 'Timestamp when the current phone number was successfully verified by an owned PHONE_VERIFICATION challenge.';
COMMENT ON COLUMN "User"."emailVerifiedAt"
  IS 'Timestamp when the current email address was successfully verified by an owned EMAIL_VERIFICATION challenge.';
