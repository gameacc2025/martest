-- Phone becomes the mandatory, sole login identity; email becomes optional.

-- Backfill existing NULL phones before the NOT NULL constraint (any user
-- without a phone cannot log in anymore). Super-admin seeded users always
-- carry a phone; placeholder 0 values should be replaced by an admin.
UPDATE "User" SET "phone" = '0' WHERE "phone" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
