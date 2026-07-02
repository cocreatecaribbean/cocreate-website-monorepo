-- Per-file approval on checkpoint attachment links
ALTER TABLE "ProjectRequestMessageAttachment"
  ADD COLUMN "clientApprovedAt" TIMESTAMP(3),
  ADD COLUMN "clientApprovedByUserId" TEXT;

ALTER TABLE "ProjectRequestMessageAttachment"
  ADD CONSTRAINT "ProjectRequestMessageAttachment_clientApprovedByUserId_fkey"
  FOREIGN KEY ("clientApprovedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ProjectRequestMessageAttachment_clientApprovedAt_idx"
  ON "ProjectRequestMessageAttachment"("clientApprovedAt");

ALTER TABLE "ClientApprovalRecord"
  ADD COLUMN "approvedAttachmentId" TEXT;
