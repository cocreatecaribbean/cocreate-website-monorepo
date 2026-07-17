-- Multi-org client email membership: per-org membership + last active org

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveOrganizationId" TEXT;

CREATE TABLE IF NOT EXISTS "ClientOrganizationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientOrgRole" "ClientOrgRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "canAccessSocialListening" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientOrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientOrganizationMembership_userId_organizationId_key"
  ON "ClientOrganizationMembership"("userId", "organizationId");

CREATE INDEX IF NOT EXISTS "ClientOrganizationMembership_organizationId_idx"
  ON "ClientOrganizationMembership"("organizationId");

CREATE INDEX IF NOT EXISTS "ClientOrganizationMembership_organizationId_clientOrgRole_idx"
  ON "ClientOrganizationMembership"("organizationId", "clientOrgRole");

CREATE INDEX IF NOT EXISTS "ClientOrganizationMembership_organizationId_status_idx"
  ON "ClientOrganizationMembership"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "ClientOrganizationMembership_userId_status_idx"
  ON "ClientOrganizationMembership"("userId", "status");

CREATE INDEX IF NOT EXISTS "User_lastActiveOrganizationId_idx"
  ON "User"("lastActiveOrganizationId");

-- Backfill memberships from legacy User.organizationId for CLIENT users
INSERT INTO "ClientOrganizationMembership" (
  "id",
  "userId",
  "organizationId",
  "clientOrgRole",
  "status",
  "canAccessSocialListening",
  "createdAt",
  "updatedAt"
)
SELECT
  'com_' || md5(u."id" || ':' || u."organizationId"),
  u."id",
  u."organizationId",
  COALESCE(u."clientOrgRole", 'CONTRIBUTOR'::"ClientOrgRole"),
  u."status",
  u."canAccessSocialListening",
  u."createdAt",
  NOW()
FROM "User" u
WHERE u."role" = 'CLIENT'
  AND u."organizationId" IS NOT NULL
  AND u."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "ClientOrganizationMembership" m
    WHERE m."userId" = u."id" AND m."organizationId" = u."organizationId"
  );

-- Seed lastActiveOrganizationId from legacy organizationId
UPDATE "User" u
SET "lastActiveOrganizationId" = u."organizationId"
WHERE u."role" = 'CLIENT'
  AND u."organizationId" IS NOT NULL
  AND u."lastActiveOrganizationId" IS NULL
  AND u."deletedAt" IS NULL;

ALTER TABLE "User"
  DROP CONSTRAINT IF EXISTS "User_lastActiveOrganizationId_fkey";

ALTER TABLE "User"
  ADD CONSTRAINT "User_lastActiveOrganizationId_fkey"
  FOREIGN KEY ("lastActiveOrganizationId")
  REFERENCES "Organization"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "ClientOrganizationMembership"
  DROP CONSTRAINT IF EXISTS "ClientOrganizationMembership_userId_fkey";

ALTER TABLE "ClientOrganizationMembership"
  ADD CONSTRAINT "ClientOrganizationMembership_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "ClientOrganizationMembership"
  DROP CONSTRAINT IF EXISTS "ClientOrganizationMembership_organizationId_fkey";

ALTER TABLE "ClientOrganizationMembership"
  ADD CONSTRAINT "ClientOrganizationMembership_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "Organization"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Notification type for "you've been added to an org"
ALTER TYPE "PortalNotificationType" ADD VALUE IF NOT EXISTS 'ORGANIZATION_MEMBERSHIP_ADDED';
