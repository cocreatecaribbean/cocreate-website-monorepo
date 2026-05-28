-- CreateTable
CREATE TABLE "OrganizationBrandAsset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationBrandAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationBrandAsset_organizationId_createdAt_idx" ON "OrganizationBrandAsset"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrganizationBrandAsset" ADD CONSTRAINT "OrganizationBrandAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationBrandAsset" ADD CONSTRAINT "OrganizationBrandAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
