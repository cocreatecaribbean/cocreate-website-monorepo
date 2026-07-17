-- AlterTable
ALTER TABLE "ClientOrganizationMembership" ADD COLUMN "canAccessGetHelp" BOOLEAN NOT NULL DEFAULT true;

-- Preserve any org-level contributor lockdown from prior migration
UPDATE "ClientOrganizationMembership" m
SET "canAccessGetHelp" = false
FROM "Organization" o
WHERE m."organizationId" = o.id
  AND o."contributorsCanAccessGetHelp" = false
  AND m."clientOrgRole" = 'CONTRIBUTOR';

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "contributorsCanAccessGetHelp";
