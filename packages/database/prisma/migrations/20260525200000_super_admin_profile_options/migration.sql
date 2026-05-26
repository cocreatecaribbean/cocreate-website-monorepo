-- Super admin role + agency profile option lists

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

CREATE TYPE "AgencyProfileOptionType" AS ENUM ('JOB_TITLE', 'DEPARTMENT');

CREATE TABLE "AgencyProfileOption" (
    "id" TEXT NOT NULL,
    "type" "AgencyProfileOptionType" NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyProfileOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgencyProfileOption_type_label_key" ON "AgencyProfileOption"("type", "label");
CREATE INDEX "AgencyProfileOption_type_isActive_sortOrder_idx" ON "AgencyProfileOption"("type", "isActive", "sortOrder");

ALTER TABLE "UserProfile" ADD COLUMN "jobTitleOptionId" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "departmentOptionId" TEXT;

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_jobTitleOptionId_fkey" FOREIGN KEY ("jobTitleOptionId") REFERENCES "AgencyProfileOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_departmentOptionId_fkey" FOREIGN KEY ("departmentOptionId") REFERENCES "AgencyProfileOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default options
INSERT INTO "AgencyProfileOption" ("id", "type", "label", "sortOrder", "isActive", "updatedAt") VALUES
  ('seed_jt_pm', 'JOB_TITLE', 'Project Manager', 0, true, CURRENT_TIMESTAMP),
  ('seed_jt_al', 'JOB_TITLE', 'Account Lead', 1, true, CURRENT_TIMESTAMP),
  ('seed_jt_am', 'JOB_TITLE', 'Account Manager', 2, true, CURRENT_TIMESTAMP),
  ('seed_dept_cs', 'DEPARTMENT', 'Client Services', 0, true, CURRENT_TIMESTAMP),
  ('seed_dept_ops', 'DEPARTMENT', 'Operations', 1, true, CURRENT_TIMESTAMP),
  ('seed_dept_creative', 'DEPARTMENT', 'Creative', 2, true, CURRENT_TIMESTAMP);

-- Best-effort link existing free-text profiles to options
UPDATE "UserProfile" p
SET "jobTitleOptionId" = o.id, "jobTitle" = o.label
FROM "AgencyProfileOption" o
WHERE o.type = 'JOB_TITLE' AND o.label = p."jobTitle" AND p."jobTitle" IS NOT NULL;

UPDATE "UserProfile" p
SET "departmentOptionId" = o.id, "department" = o.label
FROM "AgencyProfileOption" o
WHERE o.type = 'DEPARTMENT' AND o.label = p."department" AND p."department" IS NOT NULL;
