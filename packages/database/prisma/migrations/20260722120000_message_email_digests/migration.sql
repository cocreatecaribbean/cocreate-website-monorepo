-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_lastSeenAt_idx" ON "User"("lastSeenAt");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MessageEmailDigestChannel" AS ENUM ('PROJECT_REQUEST', 'ORG_INBOX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MessageEmailDigestAudience" AS ENUM ('CLIENT', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MessageEmailDigest" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "audience" "MessageEmailDigestAudience" NOT NULL,
    "channel" "MessageEmailDigestChannel" NOT NULL,
    "threadKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "projectTitle" TEXT,
    "surfaceLabel" TEXT NOT NULL,
    "deepLinkUrl" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "lastPreview" TEXT NOT NULL,
    "lastAuthorLabel" TEXT,
    "scheduledSendAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageEmailDigest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MessageEmailDigest_scheduledSendAt_sentAt_cancelledAt_idx"
  ON "MessageEmailDigest"("scheduledSendAt", "sentAt", "cancelledAt");
CREATE INDEX IF NOT EXISTS "MessageEmailDigest_recipientUserId_channel_threadKey_idx"
  ON "MessageEmailDigest"("recipientUserId", "channel", "threadKey");
CREATE INDEX IF NOT EXISTS "MessageEmailDigest_organizationId_idx"
  ON "MessageEmailDigest"("organizationId");

DO $$ BEGIN
  ALTER TABLE "MessageEmailDigest"
    ADD CONSTRAINT "MessageEmailDigest_recipientUserId_fkey"
    FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "MessageEmailDigest"
    ADD CONSTRAINT "MessageEmailDigest_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
