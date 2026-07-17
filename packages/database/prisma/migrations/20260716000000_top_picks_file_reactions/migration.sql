-- Drop approval / checkpoint system; add file reactions for Top Picks.

-- 1) Normalize checkpoint messages to chat before shrinking enums / columns
UPDATE "ProjectRequestMessage"
SET "messageKind" = 'CHAT'
WHERE "messageKind" = 'CHECKPOINT';

DELETE FROM "PortalNotification"
WHERE "type" IN (
  'CHECKPOINT_PENDING',
  'CHECKPOINT_APPROVED',
  'APPROVAL_FILE_PENDING',
  'APPROVAL_NEEDS_CHANGES',
  'APPROVAL_REVISION_SENT'
);

-- 2) Drop approval tables (children first)
DROP TABLE IF EXISTS "ProjectApprovalCommentAttachment";
DROP TABLE IF EXISTS "ProjectApprovalComment";
DROP TABLE IF EXISTS "ClientApprovalRecordAttachment";
DROP TABLE IF EXISTS "ClientApprovalRecord";
DROP TABLE IF EXISTS "ProjectApprovalItem";

-- 3) Strip checkpoint / per-attachment approve columns
ALTER TABLE "ProjectRequestMessage"
  DROP COLUMN IF EXISTS "checkpointTargetPhase",
  DROP COLUMN IF EXISTS "requiresClientApproval",
  DROP COLUMN IF EXISTS "clientApprovedAt",
  DROP COLUMN IF EXISTS "clientApprovedByUserId",
  DROP COLUMN IF EXISTS "supersededAt";

ALTER TABLE "ProjectRequestMessageAttachment"
  DROP COLUMN IF EXISTS "clientApprovedAt",
  DROP COLUMN IF EXISTS "clientApprovedByUserId";

-- 4) Rebuild ProjectMessageKind enum (CHAT only)
CREATE TYPE "ProjectMessageKind_new" AS ENUM ('CHAT');
ALTER TABLE "ProjectRequestMessage"
  ALTER COLUMN "messageKind" DROP DEFAULT,
  ALTER COLUMN "messageKind" TYPE "ProjectMessageKind_new"
    USING ("messageKind"::text::"ProjectMessageKind_new");
ALTER TABLE "ProjectRequestMessage"
  ALTER COLUMN "messageKind" SET DEFAULT 'CHAT'::"ProjectMessageKind_new";
DROP TYPE "ProjectMessageKind";
ALTER TYPE "ProjectMessageKind_new" RENAME TO "ProjectMessageKind";

-- 5) Rebuild PortalNotificationType without approval/checkpoint values
CREATE TYPE "PortalNotificationType_new" AS ENUM (
  'PROJECT_SUBMITTED',
  'PROJECT_APPROVED',
  'CHANGE_REQUEST',
  'ADMIN_REVIEW',
  'PHASE_APPROVAL',
  'REQUEST_RESOLVED',
  'REQUEST_MESSAGE',
  'CANCELLATION_REQUESTED',
  'CANCELLATION_RESOLVED',
  'TEAM_INVITE_REQUEST',
  'ORG_INBOX_MESSAGE'
);
ALTER TABLE "PortalNotification"
  ALTER COLUMN "type" TYPE "PortalNotificationType_new"
    USING ("type"::text::"PortalNotificationType_new");
DROP TYPE "PortalNotificationType";
ALTER TYPE "PortalNotificationType_new" RENAME TO "PortalNotificationType";

DROP TYPE IF EXISTS "ProjectApprovalItemStatus";

-- 6) File reactions
CREATE TYPE "ProjectFileReactionKind" AS ENUM (
  'LOVE_THIS',
  'SHIP_IT',
  'GREAT_DIRECTION',
  'ANOTHER_VERSION',
  'NEEDS_A_TWEAK'
);

CREATE TABLE "ProjectFileReaction" (
  "id" TEXT NOT NULL,
  "attachmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "ProjectFileReactionKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectFileReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectFileReaction_attachmentId_userId_key"
  ON "ProjectFileReaction"("attachmentId", "userId");

CREATE INDEX "ProjectFileReaction_attachmentId_kind_idx"
  ON "ProjectFileReaction"("attachmentId", "kind");

CREATE INDEX "ProjectFileReaction_userId_idx"
  ON "ProjectFileReaction"("userId");

ALTER TABLE "ProjectFileReaction"
  ADD CONSTRAINT "ProjectFileReaction_attachmentId_fkey"
  FOREIGN KEY ("attachmentId") REFERENCES "ProjectAttachment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectFileReaction"
  ADD CONSTRAINT "ProjectFileReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
