-- CreateTable
CREATE TABLE "OrgInboxAttachment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInboxAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgInboxMessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInboxMessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgInboxAttachment_conversationId_idx" ON "OrgInboxAttachment"("conversationId");

-- CreateIndex
CREATE INDEX "OrgInboxAttachment_organizationId_idx" ON "OrgInboxAttachment"("organizationId");

-- CreateIndex
CREATE INDEX "OrgInboxMessageAttachment_messageId_idx" ON "OrgInboxMessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "OrgInboxMessageAttachment_attachmentId_idx" ON "OrgInboxMessageAttachment"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgInboxMessageAttachment_messageId_attachmentId_key" ON "OrgInboxMessageAttachment"("messageId", "attachmentId");

-- AddForeignKey
ALTER TABLE "OrgInboxAttachment" ADD CONSTRAINT "OrgInboxAttachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInboxAttachment" ADD CONSTRAINT "OrgInboxAttachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OrgInboxConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInboxAttachment" ADD CONSTRAINT "OrgInboxAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInboxMessageAttachment" ADD CONSTRAINT "OrgInboxMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OrgInboxMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInboxMessageAttachment" ADD CONSTRAINT "OrgInboxMessageAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "OrgInboxAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
