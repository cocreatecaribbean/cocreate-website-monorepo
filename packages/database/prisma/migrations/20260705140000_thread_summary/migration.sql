-- CreateTable
CREATE TABLE "ThreadSummary" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreadSummary_sourceType_sourceId_key" ON "ThreadSummary"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ThreadSummary_sourceType_sourceId_idx" ON "ThreadSummary"("sourceType", "sourceId");
