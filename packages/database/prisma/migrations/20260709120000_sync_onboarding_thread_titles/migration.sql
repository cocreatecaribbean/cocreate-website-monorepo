-- Keep onboarding thread titles aligned with the project name they were copied from at creation.
UPDATE "ProjectRequest" pr
SET title = cp.title
FROM "ClientProject" cp
WHERE pr."projectId" = cp.id
  AND pr.type = 'ONBOARDING'
  AND pr.title <> cp.title;
