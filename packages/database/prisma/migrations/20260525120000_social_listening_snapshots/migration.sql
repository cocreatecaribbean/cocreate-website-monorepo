-- CreateTable
CREATE TABLE "SocialListeningSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "brand24ProjectId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialListeningSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialListeningSnapshot_organizationId_snapshotDate_idx" ON "SocialListeningSnapshot"("organizationId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "SocialListeningSnapshot_organizationId_snapshotDate_key" ON "SocialListeningSnapshot"("organizationId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "SocialListeningSnapshot" ADD CONSTRAINT "SocialListeningSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
