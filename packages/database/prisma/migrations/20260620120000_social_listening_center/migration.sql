-- Social Listening Center: subscriptions, payment events, billing emails, setups

CREATE TYPE "SocialListeningPlan" AS ENUM ('PULSE', 'GROWTH', 'SCALE');
CREATE TYPE "SocialListeningSubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "SocialListeningBillingSource" AS ENUM ('FYGARO', 'ADMIN_COMP', 'ADMIN_MANUAL');
CREATE TYPE "SocialListeningSubscriptionCancelledBy" AS ENUM ('CLIENT', 'ADMIN', 'SYSTEM');
CREATE TYPE "SocialListeningSetupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "SocialListeningSetupActor" AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE "SocialListeningPaymentEventType" AS ENUM ('INITIAL', 'RENEWAL', 'MANUAL_RENEWAL', 'UPDATE_PAYMENT');
CREATE TYPE "SocialListeningBillingEmailType" AS ENUM (
  'SUBSCRIPTION_ACTIVATED',
  'AUTO_RENEW_UPCOMING',
  'MANUAL_RENEW_REMINDER',
  'ENABLE_AUTO_RENEW_NUDGE',
  'AUTO_RENEW_SUCCESS',
  'AUTO_RENEW_FAILED',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_CANCELLED'
);

CREATE TABLE "SocialListeningSubscription" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "plan" "SocialListeningPlan" NOT NULL,
  "status" "SocialListeningSubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "startedAt" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "autoRenewEnabled" BOOLEAN NOT NULL DEFAULT true,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "cancelledAt" TIMESTAMP(3),
  "cancelledBy" "SocialListeningSubscriptionCancelledBy",
  "cancelReason" TEXT,
  "billingSource" "SocialListeningBillingSource" NOT NULL DEFAULT 'FYGARO',
  "fygaroCustomReference" TEXT NOT NULL,
  "paymentMethodLast4" TEXT,
  "paymentMethodBrand" TEXT,
  "paymentMethodExpMonth" INTEGER,
  "paymentMethodExpYear" INTEGER,
  "fygaroCustomerRef" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SocialListeningSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialListeningPaymentEvent" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "eventType" "SocialListeningPaymentEventType" NOT NULL,
  "fygaroTransactionId" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "rawPayload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SocialListeningPaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialListeningBillingEmailLog" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "emailType" "SocialListeningBillingEmailType" NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "resendMessageId" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SocialListeningBillingEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialListeningSetup" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" "SocialListeningSetupStatus" NOT NULL DEFAULT 'ACTIVE',
  "keywords" JSONB NOT NULL,
  "platforms" JSONB NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "brand24ProjectId" TEXT,
  "snapshotsCaptured" INTEGER NOT NULL DEFAULT 0,
  "createdBy" "SocialListeningSetupActor" NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SocialListeningSetup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialListeningSubscription_organizationId_key" ON "SocialListeningSubscription"("organizationId");
CREATE UNIQUE INDEX "SocialListeningSubscription_fygaroCustomReference_key" ON "SocialListeningSubscription"("fygaroCustomReference");
CREATE INDEX "SocialListeningSubscription_status_idx" ON "SocialListeningSubscription"("status");
CREATE INDEX "SocialListeningSubscription_currentPeriodEnd_idx" ON "SocialListeningSubscription"("currentPeriodEnd");
CREATE INDEX "SocialListeningSubscription_status_currentPeriodEnd_idx" ON "SocialListeningSubscription"("status", "currentPeriodEnd");

CREATE UNIQUE INDEX "SocialListeningPaymentEvent_fygaroTransactionId_key" ON "SocialListeningPaymentEvent"("fygaroTransactionId");
CREATE INDEX "SocialListeningPaymentEvent_subscriptionId_processedAt_idx" ON "SocialListeningPaymentEvent"("subscriptionId", "processedAt");

CREATE UNIQUE INDEX "SocialListeningBillingEmailLog_subscriptionId_emailType_periodEnd_key" ON "SocialListeningBillingEmailLog"("subscriptionId", "emailType", "periodEnd");
CREATE INDEX "SocialListeningBillingEmailLog_subscriptionId_sentAt_idx" ON "SocialListeningBillingEmailLog"("subscriptionId", "sentAt");

CREATE INDEX "SocialListeningSetup_organizationId_status_idx" ON "SocialListeningSetup"("organizationId", "status");
CREATE INDEX "SocialListeningSetup_organizationId_createdAt_idx" ON "SocialListeningSetup"("organizationId", "createdAt");
CREATE UNIQUE INDEX "SocialListeningSetup_one_active_per_org" ON "SocialListeningSetup"("organizationId") WHERE "status" = 'ACTIVE';

ALTER TABLE "SocialListeningSubscription" ADD CONSTRAINT "SocialListeningSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialListeningPaymentEvent" ADD CONSTRAINT "SocialListeningPaymentEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "SocialListeningSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialListeningBillingEmailLog" ADD CONSTRAINT "SocialListeningBillingEmailLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "SocialListeningSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialListeningSetup" ADD CONSTRAINT "SocialListeningSetup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill subscription rows for orgs already flagged as subscribers
INSERT INTO "SocialListeningSubscription" (
  "id",
  "organizationId",
  "plan",
  "status",
  "startedAt",
  "currentPeriodEnd",
  "autoRenewEnabled",
  "billingSource",
  "fygaroCustomReference",
  "createdAt",
  "updatedAt"
)
SELECT
  'slsub_legacy_' || "id",
  "id",
  'GROWTH'::"SocialListeningPlan",
  'ACTIVE'::"SocialListeningSubscriptionStatus",
  COALESCE("createdAt", NOW()),
  COALESCE("createdAt", NOW()) + INTERVAL '1 year',
  false,
  'ADMIN_MANUAL'::"SocialListeningBillingSource",
  'legacy:' || "id",
  NOW(),
  NOW()
FROM "Organization"
WHERE "isSocialListeningSubscriber" = true
ON CONFLICT ("organizationId") DO NOTHING;
