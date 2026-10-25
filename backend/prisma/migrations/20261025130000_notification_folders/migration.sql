-- Notification folders: additive, preserves all existing notifications.
CREATE TYPE "NotificationFolderScope" AS ENUM ('ALL', 'WEBSITE', 'COMPANY', 'ADMIN');

CREATE TABLE "NotificationFolder" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" "NotificationFolderScope" NOT NULL DEFAULT 'ALL',
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationFolderMembership" (
  "id" SERIAL NOT NULL,
  "notificationId" INTEGER NOT NULL,
  "folderId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationFolderMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationFolder_key_key" ON "NotificationFolder"("key");
CREATE INDEX "NotificationFolder_scope_isActive_sortOrder_idx" ON "NotificationFolder"("scope", "isActive", "sortOrder");
CREATE UNIQUE INDEX "NotificationFolderMembership_notificationId_folderId_key" ON "NotificationFolderMembership"("notificationId", "folderId");
CREATE INDEX "NotificationFolderMembership_folderId_idx" ON "NotificationFolderMembership"("folderId");

ALTER TABLE "NotificationFolderMembership" ADD CONSTRAINT "NotificationFolderMembership_notificationId_fkey"
  FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationFolderMembership" ADD CONSTRAINT "NotificationFolderMembership_folderId_fkey"
  FOREIGN KEY ("folderId") REFERENCES "NotificationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- System folders cannot be managed/deleted by users. Inbox membership is
-- explicit so moving a message out of Inbox has deterministic semantics.
INSERT INTO "NotificationFolder" ("key", "name", "scope", "isSystem", "isActive", "sortOrder", "updatedAt")
VALUES ('INBOX', 'دریافتی‌ها', 'ALL', true, true, 0, CURRENT_TIMESTAMP),
       ('SAVED', 'ذخیره‌شده‌ها', 'ALL', true, true, 1, CURRENT_TIMESTAMP);

INSERT INTO "NotificationFolderMembership" ("notificationId", "folderId")
SELECT n.id, f.id
FROM "Notification" n
CROSS JOIN "NotificationFolder" f
WHERE f."key" = 'INBOX';


-- Keep future notifications in Inbox regardless of which existing service
-- creates them; this avoids a partial rollout across event producers.
CREATE OR REPLACE FUNCTION notification_folder_default_inbox() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "NotificationFolderMembership" ("notificationId", "folderId")
  SELECT NEW.id, id FROM "NotificationFolder" WHERE "key" = 'INBOX'
  ON CONFLICT ("notificationId", "folderId") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Notification_default_inbox_membership"
AFTER INSERT ON "Notification"
FOR EACH ROW EXECUTE FUNCTION notification_folder_default_inbox();
