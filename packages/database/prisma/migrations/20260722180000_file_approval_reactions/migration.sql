-- AlterEnum
ALTER TYPE "ProjectMessageKind" ADD VALUE 'SYSTEM';

-- AlterEnum
ALTER TYPE "PortalNotificationType" ADD VALUE 'FILE_APPROVED';
ALTER TYPE "PortalNotificationType" ADD VALUE 'FILE_CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "ProjectAttachment" ADD COLUMN     "reviewRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "changesRequestedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ProjectAttachment_projectId_reviewRequested_idx" ON "ProjectAttachment"("projectId", "reviewRequested");

-- CreateIndex
CREATE INDEX "ProjectAttachment_projectId_approvedAt_idx" ON "ProjectAttachment"("projectId", "approvedAt");
