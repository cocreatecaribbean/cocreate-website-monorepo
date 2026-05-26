-- Three-thread project conversations

CREATE TYPE "ProjectMessageKind" AS ENUM ('CHAT', 'CHECKPOINT');
CREATE TYPE "CancellationOutcome" AS ENUM ('APPROVED_NO_FEE', 'APPROVED_WITH_FEE', 'DENIED');

-- New request types
CREATE TYPE "ProjectRequestType_new" AS ENUM ('ONBOARDING', 'PROGRESS', 'CANCELLATION');

ALTER TABLE "ProjectRequest" ADD COLUMN "type_new" "ProjectRequestType_new";
ALTER TABLE "ProjectRequest" ADD COLUMN "cancellationOutcome" "CancellationOutcome";
ALTER TABLE "ProjectRequest" ADD COLUMN "cancellationFeeAmount" DECIMAL(12,2);
ALTER TABLE "ProjectRequest" ADD COLUMN "cancellationFeeNotes" TEXT;

UPDATE "ProjectRequest" r
SET "type_new" = CASE
  WHEN r."type"::text = 'ADMIN_REVIEW' AND EXISTS (
    SELECT 1 FROM "ClientProject" p
    WHERE p.id = r."projectId" AND p.status = 'SUBMITTED'
  ) THEN 'ONBOARDING'::"ProjectRequestType_new"
  WHEN r."type"::text = 'ADMIN_REVIEW' THEN 'PROGRESS'::"ProjectRequestType_new"
  WHEN r."type"::text IN ('CHANGE_REQUEST', 'PHASE_APPROVAL') THEN 'PROGRESS'::"ProjectRequestType_new"
  ELSE 'PROGRESS'::"ProjectRequestType_new"
END;

-- Close onboarding threads for already-active projects
UPDATE "ProjectRequest" r
SET status = 'RESOLVED', "resolvedAt" = COALESCE("resolvedAt", NOW())
WHERE r."type_new" = 'ONBOARDING'
  AND EXISTS (
    SELECT 1 FROM "ClientProject" p
    WHERE p.id = r."projectId" AND p.status NOT IN ('SUBMITTED')
  );

ALTER TABLE "ProjectRequest" DROP COLUMN "type";
ALTER TYPE "ProjectRequestType" RENAME TO "ProjectRequestType_old";
ALTER TYPE "ProjectRequestType_new" RENAME TO "ProjectRequestType";
ALTER TABLE "ProjectRequest" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "ProjectRequest" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE "ProjectRequestType_old";

-- Message checkpoint columns
ALTER TABLE "ProjectRequestMessage" ADD COLUMN "messageKind" "ProjectMessageKind" NOT NULL DEFAULT 'CHAT';
ALTER TABLE "ProjectRequestMessage" ADD COLUMN "checkpointTargetPhase" "ClientProjectPhase";
ALTER TABLE "ProjectRequestMessage" ADD COLUMN "requiresClientApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectRequestMessage" ADD COLUMN "clientApprovedAt" TIMESTAMP(3);
ALTER TABLE "ProjectRequestMessage" ADD COLUMN "clientApprovedByUserId" TEXT;
ALTER TABLE "ProjectRequestMessage" ADD COLUMN "supersededAt" TIMESTAMP(3);

ALTER TABLE "ProjectRequestMessage" ADD CONSTRAINT "ProjectRequestMessage_clientApprovedByUserId_fkey"
  FOREIGN KEY ("clientApprovedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mark legacy phase approvals as checkpoints where applicable
UPDATE "ProjectRequestMessage" m
SET "messageKind" = 'CHECKPOINT', "requiresClientApproval" = true
FROM "ProjectRequest" r
WHERE m."requestId" = r.id
  AND r."type" = 'PROGRESS'
  AND m."authorRole" = 'ADMIN'
  AND m.id = (
    SELECT m2.id FROM "ProjectRequestMessage" m2
    WHERE m2."requestId" = r.id AND m2."authorRole" = 'ADMIN'
    ORDER BY m2."createdAt" ASC LIMIT 1
  );

CREATE TABLE "ClientApprovalRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "targetPhase" "ClientProjectPhase",
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByUserId" TEXT NOT NULL,

    CONSTRAINT "ClientApprovalRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientApprovalRecord_projectId_approvedAt_idx" ON "ClientApprovalRecord"("projectId", "approvedAt");
CREATE INDEX "ClientApprovalRecord_approvedByUserId_idx" ON "ClientApprovalRecord"("approvedByUserId");

ALTER TABLE "ClientApprovalRecord" ADD CONSTRAINT "ClientApprovalRecord_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientApprovalRecord" ADD CONSTRAINT "ClientApprovalRecord_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientApprovalRecord" ADD CONSTRAINT "ClientApprovalRecord_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "ProjectRequestMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientApprovalRecord" ADD CONSTRAINT "ClientApprovalRecord_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- One thread per type per project
CREATE UNIQUE INDEX "ProjectRequest_projectId_type_key" ON "ProjectRequest"("projectId", "type");

-- Notification types
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CHECKPOINT_PENDING';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CHECKPOINT_APPROVED';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CANCELLATION_REQUESTED';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CANCELLATION_RESOLVED';
