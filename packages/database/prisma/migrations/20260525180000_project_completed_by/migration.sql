-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN "completedByUserId" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
