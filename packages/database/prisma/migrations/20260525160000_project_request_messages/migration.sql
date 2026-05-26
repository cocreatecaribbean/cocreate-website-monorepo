-- CreateEnum
CREATE TYPE "ProjectMessageAuthorRole" AS ENUM ('ADMIN', 'CLIENT');

-- AlterEnum
ALTER TYPE "PortalNotificationType" ADD VALUE 'REQUEST_MESSAGE';

-- CreateTable
CREATE TABLE "ProjectRequestMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorRole" "ProjectMessageAuthorRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectRequestMessage_requestId_createdAt_idx" ON "ProjectRequestMessage"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectRequestMessage" ADD CONSTRAINT "ProjectRequestMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequestMessage" ADD CONSTRAINT "ProjectRequestMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
