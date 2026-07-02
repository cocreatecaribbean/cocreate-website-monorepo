-- Snapshot attachment IDs on approval records for reliable history previews
ALTER TABLE "ClientApprovalRecord" ADD COLUMN "attachmentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
