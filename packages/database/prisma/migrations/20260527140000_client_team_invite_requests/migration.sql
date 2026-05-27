-- CreateEnum
CREATE TYPE "ClientTeamInviteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'TEAM_INVITE_REQUEST';

-- CreateTable
CREATE TABLE "ClientTeamInviteRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestedClientOrgRole" "ClientOrgRole" NOT NULL,
    "canAccessSocialListening" BOOLEAN NOT NULL DEFAULT false,
    "status" "ClientTeamInviteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "resultingUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientTeamInviteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientTeamInviteRequest_organizationId_status_idx" ON "ClientTeamInviteRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ClientTeamInviteRequest_requestedByUserId_idx" ON "ClientTeamInviteRequest"("requestedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientTeamInviteRequest_organizationId_email_pending_key" ON "ClientTeamInviteRequest"("organizationId", "email") WHERE ("status" = 'PENDING');

-- AddForeignKey
ALTER TABLE "ClientTeamInviteRequest" ADD CONSTRAINT "ClientTeamInviteRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamInviteRequest" ADD CONSTRAINT "ClientTeamInviteRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamInviteRequest" ADD CONSTRAINT "ClientTeamInviteRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamInviteRequest" ADD CONSTRAINT "ClientTeamInviteRequest_resultingUserId_fkey" FOREIGN KEY ("resultingUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
