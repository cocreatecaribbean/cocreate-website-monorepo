-- CreateTable
CREATE TABLE "ProjectRequestMessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRequestMessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectRequestMessageAttachment_messageId_idx" ON "ProjectRequestMessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "ProjectRequestMessageAttachment_attachmentId_idx" ON "ProjectRequestMessageAttachment"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequestMessageAttachment_messageId_attachmentId_key" ON "ProjectRequestMessageAttachment"("messageId", "attachmentId");

-- AddForeignKey
ALTER TABLE "ProjectRequestMessageAttachment" ADD CONSTRAINT "ProjectRequestMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ProjectRequestMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequestMessageAttachment" ADD CONSTRAINT "ProjectRequestMessageAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "ProjectAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
