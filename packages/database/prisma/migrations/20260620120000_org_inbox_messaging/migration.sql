-- Org inbox messaging
CREATE TYPE "OrgInboxVisibility" AS ENUM ('ORG_WIDE', 'RESTRICTED');
CREATE TYPE "OrgInboxAuthorRole" AS ENUM ('CLIENT', 'ADMIN');

ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'ORG_INBOX_MESSAGE';

CREATE TABLE "OrgInboxConversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "visibility" "OrgInboxVisibility" NOT NULL,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgInboxConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgInboxParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OrgInboxParticipant_pkey" PRIMARY KEY ("conversationId","userId")
);

CREATE TABLE "OrgInboxMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorRole" "OrgInboxAuthorRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInboxMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgInboxReadCursor" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInboxReadCursor_pkey" PRIMARY KEY ("conversationId","userId")
);

CREATE INDEX "OrgInboxConversation_organizationId_updatedAt_idx" ON "OrgInboxConversation"("organizationId", "updatedAt");

CREATE INDEX "OrgInboxParticipant_userId_idx" ON "OrgInboxParticipant"("userId");

CREATE INDEX "OrgInboxMessage_conversationId_createdAt_idx" ON "OrgInboxMessage"("conversationId", "createdAt");

ALTER TABLE "OrgInboxConversation" ADD CONSTRAINT "OrgInboxConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgInboxConversation" ADD CONSTRAINT "OrgInboxConversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrgInboxParticipant" ADD CONSTRAINT "OrgInboxParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OrgInboxConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgInboxParticipant" ADD CONSTRAINT "OrgInboxParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgInboxMessage" ADD CONSTRAINT "OrgInboxMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OrgInboxConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgInboxMessage" ADD CONSTRAINT "OrgInboxMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrgInboxReadCursor" ADD CONSTRAINT "OrgInboxReadCursor_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OrgInboxConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgInboxReadCursor" ADD CONSTRAINT "OrgInboxReadCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
