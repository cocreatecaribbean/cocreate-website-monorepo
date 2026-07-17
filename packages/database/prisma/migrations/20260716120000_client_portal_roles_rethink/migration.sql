-- Client portal roles rethink: ADMIN / CONTRIBUTOR / VIEWER / SOCIAL_ANALYST
-- Drop project MANAGE/VIEW; add project ownerUserId

-- 1) Remap org roles via a new enum
CREATE TYPE "ClientOrgRole_new" AS ENUM ('ADMIN', 'CONTRIBUTOR', 'VIEWER', 'SOCIAL_ANALYST');

ALTER TABLE "User" ALTER COLUMN "clientOrgRole" DROP DEFAULT;
ALTER TABLE "ClientTeamInviteRequest" ALTER COLUMN "requestedClientOrgRole" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "clientOrgRole" TYPE "ClientOrgRole_new"
  USING (
    CASE "clientOrgRole"::text
      WHEN 'OWNER' THEN 'ADMIN'::"ClientOrgRole_new"
      WHEN 'PROJECT_MANAGER' THEN 'CONTRIBUTOR'::"ClientOrgRole_new"
      WHEN 'MEMBER' THEN 'CONTRIBUTOR'::"ClientOrgRole_new"
      ELSE NULL
    END
  );

ALTER TABLE "ClientTeamInviteRequest"
  ALTER COLUMN "requestedClientOrgRole" TYPE "ClientOrgRole_new"
  USING (
    CASE "requestedClientOrgRole"::text
      WHEN 'OWNER' THEN 'ADMIN'::"ClientOrgRole_new"
      WHEN 'PROJECT_MANAGER' THEN 'CONTRIBUTOR'::"ClientOrgRole_new"
      WHEN 'MEMBER' THEN 'CONTRIBUTOR'::"ClientOrgRole_new"
      ELSE 'CONTRIBUTOR'::"ClientOrgRole_new"
    END
  );

DROP TYPE "ClientOrgRole";
ALTER TYPE "ClientOrgRole_new" RENAME TO "ClientOrgRole";

-- 2) Drop per-project access level
ALTER TABLE "ClientProjectMember" DROP COLUMN IF EXISTS "access";
DROP TYPE IF EXISTS "ClientProjectAccessLevel";

-- 3) Add project owner (Admin). Backfill from creator if Admin, else first Admin in org.
ALTER TABLE "ClientProject" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

UPDATE "ClientProject" AS p
SET "ownerUserId" = COALESCE(
  (
    SELECT u.id
    FROM "User" u
    WHERE u.id = p."createdByUserId"
      AND u."clientOrgRole" = 'ADMIN'
      AND u."organizationId" = p."organizationId"
    LIMIT 1
  ),
  (
    SELECT u.id
    FROM "User" u
    WHERE u."organizationId" = p."organizationId"
      AND u."clientOrgRole" = 'ADMIN'
      AND u."deletedAt" IS NULL
    ORDER BY u."createdAt" ASC
    LIMIT 1
  ),
  p."createdByUserId"
)
WHERE p."ownerUserId" IS NULL;

-- Promote creators who still own projects but aren't Admin yet (edge case)
UPDATE "User" u
SET "clientOrgRole" = 'ADMIN'
WHERE u.id IN (
  SELECT DISTINCT p."ownerUserId" FROM "ClientProject" p WHERE p."ownerUserId" IS NOT NULL
)
AND u."clientOrgRole" IS DISTINCT FROM 'ADMIN'
AND u.role = 'CLIENT';

ALTER TABLE "ClientProject" ALTER COLUMN "ownerUserId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "ClientProject_ownerUserId_idx" ON "ClientProject"("ownerUserId");

ALTER TABLE "ClientProject"
  ADD CONSTRAINT "ClientProject_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
