-- CreateEnum
CREATE TYPE "ProjectApprovalItemStatus" AS ENUM ('PENDING', 'APPROVED', 'NEEDS_CHANGES');

-- AlterEnum
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'APPROVAL_FILE_PENDING';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'APPROVAL_NEEDS_CHANGES';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'APPROVAL_REVISION_SENT';

-- AlterTable
ALTER TABLE "ClientApprovalRecord" ALTER COLUMN "messageId" DROP NOT NULL;
ALTER TABLE "ClientApprovalRecord" ADD COLUMN "approvalItemId" TEXT;

-- CreateTable
CREATE TABLE "ProjectApprovalItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "status" "ProjectApprovalItemStatus" NOT NULL DEFAULT 'PENDING',
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "sentByUserId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectApprovalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectApprovalComment" (
    "id" TEXT NOT NULL,
    "approvalItemId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorRole" "ProjectMessageAuthorRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectApprovalComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectApprovalCommentAttachment" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectApprovalCommentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectApprovalItem_projectId_status_idx" ON "ProjectApprovalItem"("projectId", "status");
CREATE INDEX "ProjectApprovalItem_requestId_status_idx" ON "ProjectApprovalItem"("requestId", "status");
CREATE INDEX "ProjectApprovalItem_status_sentAt_idx" ON "ProjectApprovalItem"("status", "sentAt");
CREATE INDEX "ProjectApprovalComment_approvalItemId_createdAt_idx" ON "ProjectApprovalComment"("approvalItemId", "createdAt");
CREATE UNIQUE INDEX "ProjectApprovalCommentAttachment_commentId_attachmentId_key" ON "ProjectApprovalCommentAttachment"("commentId", "attachmentId");
CREATE INDEX "ProjectApprovalCommentAttachment_commentId_idx" ON "ProjectApprovalCommentAttachment"("commentId");
CREATE INDEX "ClientApprovalRecord_approvalItemId_idx" ON "ClientApprovalRecord"("approvalItemId");

-- AddForeignKey
ALTER TABLE "ClientApprovalRecord" ADD CONSTRAINT "ClientApprovalRecord_approvalItemId_fkey" FOREIGN KEY ("approvalItemId") REFERENCES "ProjectApprovalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalItem" ADD CONSTRAINT "ProjectApprovalItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalItem" ADD CONSTRAINT "ProjectApprovalItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalItem" ADD CONSTRAINT "ProjectApprovalItem_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "ProjectAttachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalItem" ADD CONSTRAINT "ProjectApprovalItem_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalItem" ADD CONSTRAINT "ProjectApprovalItem_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalComment" ADD CONSTRAINT "ProjectApprovalComment_approvalItemId_fkey" FOREIGN KEY ("approvalItemId") REFERENCES "ProjectApprovalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalComment" ADD CONSTRAINT "ProjectApprovalComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalCommentAttachment" ADD CONSTRAINT "ProjectApprovalCommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ProjectApprovalComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectApprovalCommentAttachment" ADD CONSTRAINT "ProjectApprovalCommentAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "ProjectAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill open pending checkpoint files into standalone approval items
INSERT INTO "ProjectApprovalItem" (
    "id",
    "projectId",
    "requestId",
    "attachmentId",
    "title",
    "note",
    "status",
    "revisionNumber",
    "sentByUserId",
    "sentAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'pai_' || link."id",
    req."projectId",
    msg."requestId",
    link."attachmentId",
    COALESCE(NULLIF(req."title", ''), att."fileName"),
    NULLIF(TRIM(msg."body"), ''),
    'PENDING'::"ProjectApprovalItemStatus",
    1,
    msg."authorUserId",
    msg."createdAt",
    msg."createdAt",
    NOW()
FROM "ProjectRequestMessageAttachment" link
JOIN "ProjectRequestMessage" msg ON msg."id" = link."messageId"
JOIN "ProjectRequest" req ON req."id" = msg."requestId"
JOIN "ProjectAttachment" att ON att."id" = link."attachmentId"
WHERE msg."messageKind" = 'CHECKPOINT'
  AND msg."requiresClientApproval" = true
  AND msg."supersededAt" IS NULL
  AND msg."clientApprovedAt" IS NULL
  AND link."clientApprovedAt" IS NULL
  AND req."type" = 'PROGRESS'
ON CONFLICT DO NOTHING;
