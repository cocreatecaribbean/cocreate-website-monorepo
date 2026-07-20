-- Progress threads should always use the canonical label (legacy CHANGE_REQUEST titles may linger).
UPDATE "ProjectRequest"
SET title = 'Project progress',
    description = 'Collaboration and progress updates'
WHERE type = 'PROGRESS'
  AND (
    title <> 'Project progress'
    OR description IS DISTINCT FROM 'Collaboration and progress updates'
  );

-- Keep onboarding thread titles aligned with the live project name.
UPDATE "ProjectRequest" pr
SET title = cp.title
FROM "ClientProject" cp
WHERE pr."projectId" = cp.id
  AND pr.type = 'ONBOARDING'
  AND pr.title <> cp.title;
