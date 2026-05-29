-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'COLLABORATOR';

-- AlterEnum
ALTER TYPE "ProjectRequestType" ADD VALUE 'INTERNAL';

-- AlterEnum
ALTER TYPE "ProjectMessageAuthorRole" ADD VALUE 'COLLABORATOR';

-- CreateEnum
CREATE TYPE "ProjectAttachmentVisibility" AS ENUM ('CLIENT', 'INTERNAL');

-- AlterTable
ALTER TABLE "ProjectAttachment" ADD COLUMN "visibility" "ProjectAttachmentVisibility" NOT NULL DEFAULT 'CLIENT';

-- CreateTable
CREATE TABLE "AgencyProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyProjectMember_userId_idx" ON "AgencyProjectMember"("userId");

-- CreateIndex
CREATE INDEX "AgencyProjectMember_projectId_idx" ON "AgencyProjectMember"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProjectMember_projectId_userId_key" ON "AgencyProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectAttachment_projectId_visibility_idx" ON "ProjectAttachment"("projectId", "visibility");

-- AddForeignKey
ALTER TABLE "AgencyProjectMember" ADD CONSTRAINT "AgencyProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyProjectMember" ADD CONSTRAINT "AgencyProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyProjectMember" ADD CONSTRAINT "AgencyProjectMember_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
