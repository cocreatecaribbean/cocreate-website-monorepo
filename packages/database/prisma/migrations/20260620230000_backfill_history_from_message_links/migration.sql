-- Backfill attachmentIds on history rows from checkpoint message links
UPDATE "ClientApprovalRecord" car
SET "attachmentIds" = sub.ids
FROM (
  SELECT car2.id,
         ARRAY_AGG(prma."attachmentId" ORDER BY prma."createdAt") AS ids
  FROM "ClientApprovalRecord" car2
  JOIN "ProjectRequestMessage" prm ON prm.id = car2."messageId"
  JOIN "ProjectRequestMessageAttachment" prma ON prma."messageId" = prm.id
  WHERE cardinality(car2."attachmentIds") = 0
  GROUP BY car2.id
) sub
WHERE car.id = sub.id;
