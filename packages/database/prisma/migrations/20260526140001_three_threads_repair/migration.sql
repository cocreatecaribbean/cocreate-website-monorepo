-- Repair partial migration for three-thread model

DO $$ BEGIN
  CREATE TYPE "ProjectMessageKind" AS ENUM ('CHAT', 'CHECKPOINT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CancellationOutcome" AS ENUM ('APPROVED_NO_FEE', 'APPROVED_WITH_FEE', 'DENIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectRequestType_new" AS ENUM ('ONBOARDING', 'PROGRESS', 'CANCELLATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "type_new" "ProjectRequestType_new";
ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "cancellationOutcome" "CancellationOutcome";
ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "cancellationFeeAmount" DECIMAL(12,2);
ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "cancellationFeeNotes" TEXT;

UPDATE "ProjectRequest" r
SET "type_new" = CASE
  WHEN r."type"::text = 'ADMIN_REVIEW' AND EXISTS (
    SELECT 1 FROM "ClientProject" p
    WHERE p.id = r."projectId" AND p.status = 'SUBMITTED'
  ) THEN 'ONBOARDING'::"ProjectRequestType_new"
  ELSE 'PROGRESS'::"ProjectRequestType_new"
END
WHERE r."type_new" IS NULL;

UPDATE "ProjectRequest" r
SET status = 'RESOLVED', "resolvedAt" = COALESCE("resolvedAt", NOW())
WHERE r."type_new" = 'ONBOARDING'
  AND EXISTS (
    SELECT 1 FROM "ClientProject" p
    WHERE p.id = r."projectId" AND p.status NOT IN ('SUBMITTED')
  );

ALTER TABLE "ProjectRequest" DROP COLUMN IF EXISTS "type";
DROP TYPE IF EXISTS "ProjectRequestType_old";
ALTER TYPE "ProjectRequestType" RENAME TO "ProjectRequestType_old";
ALTER TYPE "ProjectRequestType_new" RENAME TO "ProjectRequestType";
ALTER TABLE "ProjectRequest" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "ProjectRequest" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE "ProjectRequestType_old";

ALTER TABLE "ProjectRequestMessage" ADD COLUMN IF NOT EXISTS "messageKind" "ProjectMessageKind" NOT NULL DEFAULT 'CHAT';
ALTER TABLE "ProjectRequestMessage" ADD COLUMN IF NOT EXISTS "checkpointTargetPhase" "ClientProjectPhase";
ALTER TABLE "ProjectRequestMessage" ADD COLUMN IF NOT EXISTS "requiresClientApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectRequestMessage" ADD COLUMN IF NOT EXISTS "clientApprovedAt" TIMESTAMP(3);
ALTER TABLE "ProjectRequestMessage" ADD COLUMN IF NOT EXISTS "clientApprovedByUserId" TEXT;
ALTER TABLE "ProjectRequestMessage" ADD COLUMN IF NOT EXISTS "supersededAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "ProjectRequestMessage" ADD CONSTRAINT "ProjectRequestMessage_clientApprovedByUserId_fkey"
    FOREIGN KEY ("clientApprovedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ClientApprovalRecord" (
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

CREATE INDEX IF NOT EXISTS "ClientApprovalRecord_projectId_approvedAt_idx" ON "ClientApprovalRecord"("projectId", "approvedAt");
CREATE INDEX IF NOT EXISTS "ClientApprovalRecord_approvedByUserId_idx" ON "ClientApprovalRecord"("approvedByUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectRequest_projectId_type_key" ON "ProjectRequest"("projectId", "type");

ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CHECKPOINT_PENDING';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CHECKPOINT_APPROVED';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CANCELLATION_REQUESTED';
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'CANCELLATION_RESOLVED';
