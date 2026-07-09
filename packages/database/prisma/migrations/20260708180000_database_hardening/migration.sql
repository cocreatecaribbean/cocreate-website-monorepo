-- Soft-delete columns on core tenant entities
ALTER TABLE "Organization" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ClientProject" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX "ClientProject_deletedAt_idx" ON "ClientProject"("deletedAt");

-- FK: social listening subscription/setup creators → User
ALTER TABLE "SocialListeningSubscription"
  ADD CONSTRAINT "SocialListeningSubscription_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialListeningSetup"
  ADD CONSTRAINT "SocialListeningSetup_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Approval record attachment junction (replaces attachmentIds array)
CREATE TABLE "ClientApprovalRecordAttachment" (
    "id" TEXT NOT NULL,
    "approvalRecordId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientApprovalRecordAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientApprovalRecordAttachment_approvalRecordId_attachmentId_key"
  ON "ClientApprovalRecordAttachment"("approvalRecordId", "attachmentId");
CREATE INDEX "ClientApprovalRecordAttachment_approvalRecordId_idx"
  ON "ClientApprovalRecordAttachment"("approvalRecordId");
CREATE INDEX "ClientApprovalRecordAttachment_attachmentId_idx"
  ON "ClientApprovalRecordAttachment"("attachmentId");

ALTER TABLE "ClientApprovalRecordAttachment"
  ADD CONSTRAINT "ClientApprovalRecordAttachment_approvalRecordId_fkey"
  FOREIGN KEY ("approvalRecordId") REFERENCES "ClientApprovalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientApprovalRecordAttachment"
  ADD CONSTRAINT "ClientApprovalRecordAttachment_attachmentId_fkey"
  FOREIGN KEY ("attachmentId") REFERENCES "ProjectAttachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill junction rows from legacy attachmentIds array
INSERT INTO "ClientApprovalRecordAttachment" ("id", "approvalRecordId", "attachmentId", "createdAt")
SELECT
  'car_' || substr(md5(r."id" || att_id || random()::text), 1, 24),
  r."id",
  att_id,
  r."approvedAt"
FROM "ClientApprovalRecord" r,
LATERAL unnest(r."attachmentIds") AS att_id
WHERE cardinality(r."attachmentIds") > 0
ON CONFLICT ("approvalRecordId", "attachmentId") DO NOTHING;

ALTER TABLE "ClientApprovalRecord" DROP COLUMN "attachmentIds";
