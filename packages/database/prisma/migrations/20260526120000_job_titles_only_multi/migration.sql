-- Job titles only; multiple titles per admin profile

CREATE TABLE "UserProfileJobTitle" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserProfileJobTitle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfileJobTitle_profileId_optionId_key" ON "UserProfileJobTitle"("profileId", "optionId");
CREATE INDEX "UserProfileJobTitle_profileId_sortOrder_idx" ON "UserProfileJobTitle"("profileId", "sortOrder");

ALTER TABLE "UserProfileJobTitle" ADD CONSTRAINT "UserProfileJobTitle_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProfileJobTitle" ADD CONSTRAINT "UserProfileJobTitle_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "AgencyProfileOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate single job title FK to join rows
INSERT INTO "UserProfileJobTitle" ("id", "profileId", "optionId", "sortOrder")
SELECT
  'mig_jt_' || p."id",
  p."id",
  p."jobTitleOptionId",
  0
FROM "UserProfile" p
WHERE p."jobTitleOptionId" IS NOT NULL;

-- Drop legacy profile columns
ALTER TABLE "UserProfile" DROP CONSTRAINT IF EXISTS "UserProfile_jobTitleOptionId_fkey";
ALTER TABLE "UserProfile" DROP CONSTRAINT IF EXISTS "UserProfile_departmentOptionId_fkey";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "jobTitleOptionId";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "departmentOptionId";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "department";

-- Remove department options
DELETE FROM "AgencyProfileOption" WHERE "type" = 'DEPARTMENT';

-- Simplify option list (label unique agency-wide)
DROP INDEX IF EXISTS "AgencyProfileOption_type_label_key";
DROP INDEX IF EXISTS "AgencyProfileOption_type_isActive_sortOrder_idx";

ALTER TABLE "AgencyProfileOption" DROP COLUMN "type";

CREATE UNIQUE INDEX "AgencyProfileOption_label_key" ON "AgencyProfileOption"("label");
CREATE INDEX "AgencyProfileOption_isActive_sortOrder_idx" ON "AgencyProfileOption"("isActive", "sortOrder");

DROP TYPE IF EXISTS "AgencyProfileOptionType";
