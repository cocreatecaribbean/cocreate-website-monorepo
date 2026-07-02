-- Backfill attachmentIds on history rows that only have approvedAttachmentId
UPDATE "ClientApprovalRecord"
SET "attachmentIds" = ARRAY["approvedAttachmentId"]::TEXT[]
WHERE cardinality("attachmentIds") = 0
  AND "approvedAttachmentId" IS NOT NULL;

-- Backfill from standalone approval items when attachmentIds is still empty
UPDATE "ClientApprovalRecord" car
SET "attachmentIds" = ARRAY[pai."attachmentId"]::TEXT[]
FROM "ProjectApprovalItem" pai
WHERE car."approvalItemId" = pai.id
  AND cardinality(car."attachmentIds") = 0
  AND pai."attachmentId" IS NOT NULL;
