-- CreateEnum
CREATE TYPE "ClientOrgRole" AS ENUM ('OWNER', 'PROJECT_MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ClientProjectAccessLevel" AS ENUM ('MANAGE', 'VIEW');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "clientOrgRole" "ClientOrgRole",
ADD COLUMN "canAccessSocialListening" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ClientProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "access" "ClientProjectAccessLevel" NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientProjectMember_userId_idx" ON "ClientProjectMember"("userId");

-- CreateIndex
CREATE INDEX "ClientProjectMember_projectId_idx" ON "ClientProjectMember"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProjectMember_projectId_userId_key" ON "ClientProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "User_organizationId_clientOrgRole_idx" ON "User"("organizationId", "clientOrgRole");

-- AddForeignKey
ALTER TABLE "ClientProjectMember" ADD CONSTRAINT "ClientProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProjectMember" ADD CONSTRAINT "ClientProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProjectMember" ADD CONSTRAINT "ClientProjectMember_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: existing CLIENT users become OWNER; grant social listening if org is subscribed
UPDATE "User" u
SET
  "clientOrgRole" = 'OWNER',
  "canAccessSocialListening" = COALESCE(
    (
      SELECT o."isSocialListeningSubscriber"
      FROM "Organization" o
      WHERE o."id" = u."organizationId"
    ),
    false
  )
WHERE u."role" = 'CLIENT' AND u."organizationId" IS NOT NULL;
