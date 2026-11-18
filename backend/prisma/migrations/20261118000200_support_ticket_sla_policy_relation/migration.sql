-- Persist the exact SLA policy applied when a support ticket is created.
-- Existing tickets remain valid with a NULL policy reference.
ALTER TABLE "SupportTicket"
  ADD COLUMN "slaPolicyId" INTEGER;

CREATE INDEX "SupportTicket_slaPolicyId_idx"
  ON "SupportTicket" ("slaPolicyId");

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_slaPolicyId_fkey"
  FOREIGN KEY ("slaPolicyId")
  REFERENCES "SupportSlaPolicy" ("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

COMMENT ON COLUMN "SupportTicket"."slaPolicyId"
  IS 'SLA policy applied when the support ticket was created; nullable to preserve tickets if a policy is removed.';
