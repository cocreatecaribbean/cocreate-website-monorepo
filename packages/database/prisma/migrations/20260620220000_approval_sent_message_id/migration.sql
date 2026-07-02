-- Link approval items to the thread message that announced them
ALTER TABLE "ProjectApprovalItem" ADD COLUMN "sentMessageId" TEXT;

ALTER TABLE "ProjectApprovalItem" ADD CONSTRAINT "ProjectApprovalItem_sentMessageId_fkey"
  FOREIGN KEY ("sentMessageId") REFERENCES "ProjectRequestMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ProjectApprovalItem_sentMessageId_idx" ON "ProjectApprovalItem"("sentMessageId");
