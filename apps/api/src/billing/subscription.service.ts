import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientOrgRole,
  SocialListeningBillingSource,
  SocialListeningPlan,
  SocialListeningSubscriptionCancelledBy,
  SocialListeningSubscriptionStatus,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import { randomBytes } from 'node:crypto'
import {
  buildFygaroCustomReference,
  getPlanByPrismaPlan,
  planIdToPrismaPlan,
  type SocialListeningPlanId,
} from '@cocreate/social-listening-plans'
import type { ClientSubscriptionView } from '@cocreate/api-contracts/v1/client-portal'
import { PrismaService } from '../prisma/prisma.service'

export type FygaroWebhookCard = {
  last4?: string | null
  expMonth?: number | null
  expYear?: number | null
  brand?: string | null
}

export type FygaroWebhookPayload = {
  transactionId: string
  reference?: string
  customReference?: string | null
  amount?: string
  currency?: string
  createdAt?: string
  card?: FygaroWebhookCard
  client?: { email?: string }
}

const GRACE_PERIOD_DAYS = 3

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name)

  constructor(private readonly prisma: PrismaService) {}

  isEntitled(subscription: {
    status: SocialListeningSubscriptionStatus
    currentPeriodEnd: Date | null
  }): boolean {
    if (subscription.status !== SocialListeningSubscriptionStatus.ACTIVE) {
      return false
    }
    if (!subscription.currentPeriodEnd) return false
    return subscription.currentPeriodEnd.getTime() > Date.now()
  }

  async syncOrgEntitlement(organizationId: string, enabled: boolean): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { isSocialListeningSubscriber: enabled },
      })

      if (enabled) {
        await tx.user.updateMany({
          where: {
            organizationId,
            role: UserRole.CLIENT,
            clientOrgRole: ClientOrgRole.OWNER,
            status: { not: UserStatus.SUSPENDED },
            deletedAt: null,
          },
          data: { canAccessSocialListening: true },
        })
      }
    })
  }

  /** Admin Center toggle — keeps subscription row and org flag in sync. */
  async setAdminCompEntitlement(organizationId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      await this.grantAdminSubscription({
        organizationId,
        plan: SocialListeningPlan.GROWTH,
        billingSource: SocialListeningBillingSource.ADMIN_COMP,
        periodMonths: 12,
        autoRenewEnabled: false,
      })
      return
    }

    const sub = await this.prisma.socialListeningSubscription.findUnique({
      where: { organizationId },
    })

    if (sub) {
      await this.prisma.socialListeningSubscription.update({
        where: { id: sub.id },
        data: {
          status: SocialListeningSubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: SocialListeningSubscriptionCancelledBy.ADMIN,
          autoRenewEnabled: false,
          cancelAtPeriodEnd: false,
        },
      })
    }

    await this.syncOrgEntitlement(organizationId, false)
  }

  async getByOrganizationId(organizationId: string) {
    return this.prisma.socialListeningSubscription.findUnique({
      where: { organizationId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        paymentEvents: { orderBy: { processedAt: 'desc' }, take: 20 },
        billingEmailLogs: { orderBy: { sentAt: 'desc' }, take: 20 },
      },
    })
  }

  async getById(subscriptionId: string) {
    const sub = await this.prisma.socialListeningSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })
    if (!sub) throw new NotFoundException('Subscription not found')
    return sub
  }

  async createPendingFygaroSubscription(params: {
    organizationId: string
    planId: SocialListeningPlanId
    createdByUserId?: string
  }) {
    const org = await this.prisma.organization.findUnique({
      where: { id: params.organizationId },
    })
    if (!org) throw new NotFoundException('Organization not found')

    const plan = planIdToPrismaPlan(params.planId)
    const subscriptionId = `slsub_${randomBytes(12).toString('hex')}`
    const fygaroCustomReference = buildFygaroCustomReference(subscriptionId, 'initial')

    const existing = await this.prisma.socialListeningSubscription.findUnique({
      where: { organizationId: params.organizationId },
    })

    if (existing) {
      if (
        existing.status === SocialListeningSubscriptionStatus.ACTIVE &&
        this.isEntitled(existing)
      ) {
        throw new BadRequestException('Organization already has an active subscription')
      }
      return this.prisma.socialListeningSubscription.update({
        where: { id: existing.id },
        data: {
          plan,
          status: SocialListeningSubscriptionStatus.PENDING_PAYMENT,
          billingSource: SocialListeningBillingSource.FYGARO,
          autoRenewEnabled: true,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          cancelledBy: null,
          cancelReason: null,
          startedAt: null,
          currentPeriodEnd: null,
          fygaroCustomReference,
          createdByUserId: params.createdByUserId ?? null,
        },
      })
    }

    return this.prisma.socialListeningSubscription.create({
      data: {
        id: subscriptionId,
        organizationId: params.organizationId,
        plan,
        status: SocialListeningSubscriptionStatus.PENDING_PAYMENT,
        billingSource: SocialListeningBillingSource.FYGARO,
        fygaroCustomReference,
        createdByUserId: params.createdByUserId ?? null,
      },
    })
  }

  async grantAdminSubscription(params: {
    organizationId: string
    plan: SocialListeningPlan
    billingSource: SocialListeningBillingSource
    periodMonths?: number
    autoRenewEnabled?: boolean
    createdByUserId?: string
  }) {
    const months = params.periodMonths ?? 1
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + months)

    const subscriptionId = `slsub_${randomBytes(12).toString('hex')}`
    const fygaroCustomReference = `admin:${params.organizationId}:${subscriptionId}`

    const subscription = await this.prisma.socialListeningSubscription.upsert({
      where: { organizationId: params.organizationId },
      create: {
        id: subscriptionId,
        organizationId: params.organizationId,
        plan: params.plan,
        status: SocialListeningSubscriptionStatus.ACTIVE,
        startedAt: now,
        currentPeriodEnd: periodEnd,
        billingSource: params.billingSource,
        autoRenewEnabled: params.autoRenewEnabled ?? false,
        fygaroCustomReference,
        createdByUserId: params.createdByUserId ?? null,
      },
      update: {
        plan: params.plan,
        status: SocialListeningSubscriptionStatus.ACTIVE,
        startedAt: now,
        currentPeriodEnd: periodEnd,
        billingSource: params.billingSource,
        autoRenewEnabled: params.autoRenewEnabled ?? false,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
      },
    })

    await this.syncOrgEntitlement(params.organizationId, true)
    return subscription
  }

  async activateFromPayment(
    subscriptionId: string,
    payload: FygaroWebhookPayload,
    eventType: 'INITIAL' | 'MANUAL_RENEWAL',
  ) {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1)

    const subscription = await this.prisma.socialListeningSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SocialListeningSubscriptionStatus.ACTIVE,
        startedAt: now,
        currentPeriodEnd: periodEnd,
        autoRenewEnabled: eventType === 'INITIAL',
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        ...this.cardFieldsFromPayload(payload),
      },
    })

    await this.syncOrgEntitlement(subscription.organizationId, true)
    this.logger.log(`Subscription ${subscriptionId} activated (${eventType})`)
    return subscription
  }

  async extendPeriod(subscriptionId: string, payload?: FygaroWebhookPayload) {
    const sub = await this.getById(subscriptionId)
    const base = sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > Date.now()
      ? sub.currentPeriodEnd
      : new Date()
    const periodEnd = new Date(base)
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1)

    const subscription = await this.prisma.socialListeningSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SocialListeningSubscriptionStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        ...(payload ? this.cardFieldsFromPayload(payload) : {}),
      },
    })

    await this.syncOrgEntitlement(subscription.organizationId, true)
    return subscription
  }

  async updatePaymentMethod(
    subscriptionId: string,
    payload: FygaroWebhookPayload,
  ) {
    return this.prisma.socialListeningSubscription.update({
      where: { id: subscriptionId },
      data: this.cardFieldsFromPayload(payload),
    })
  }

  async markPastDue(subscriptionId: string) {
    const subscription = await this.prisma.socialListeningSubscription.update({
      where: { id: subscriptionId },
      data: { status: SocialListeningSubscriptionStatus.PAST_DUE },
    })
    return subscription
  }

  async expireDueSubscriptions(): Promise<number> {
    const now = new Date()
    const graceCutoff = new Date(now)
    graceCutoff.setUTCDate(graceCutoff.getUTCDate() - GRACE_PERIOD_DAYS)

    const due = await this.prisma.socialListeningSubscription.findMany({
      where: {
        status: {
          in: [
            SocialListeningSubscriptionStatus.ACTIVE,
            SocialListeningSubscriptionStatus.PAST_DUE,
            SocialListeningSubscriptionStatus.CANCELLED,
          ],
        },
        currentPeriodEnd: { lte: now },
        OR: [
          { status: SocialListeningSubscriptionStatus.CANCELLED },
          { cancelAtPeriodEnd: true },
          { autoRenewEnabled: false },
          {
            status: SocialListeningSubscriptionStatus.PAST_DUE,
            currentPeriodEnd: { lte: graceCutoff },
          },
        ],
      },
    })

    let count = 0
    for (const sub of due) {
      if (sub.status === SocialListeningSubscriptionStatus.ACTIVE && sub.autoRenewEnabled) {
        continue
      }
      await this.prisma.socialListeningSubscription.update({
        where: { id: sub.id },
        data: { status: SocialListeningSubscriptionStatus.EXPIRED },
      })
      await this.syncOrgEntitlement(sub.organizationId, false)
      count++
    }
    return count
  }

  async cancel(params: {
    organizationId: string
    immediate: boolean
    cancelledBy: SocialListeningSubscriptionCancelledBy
    cancelReason?: string
  }) {
    const sub = await this.prisma.socialListeningSubscription.findUnique({
      where: { organizationId: params.organizationId },
    })
    if (!sub) throw new NotFoundException('Subscription not found')

    if (params.immediate) {
      const updated = await this.prisma.socialListeningSubscription.update({
        where: { id: sub.id },
        data: {
          status: SocialListeningSubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: params.cancelledBy,
          cancelReason: params.cancelReason ?? null,
          cancelAtPeriodEnd: false,
          autoRenewEnabled: false,
        },
      })
      await this.syncOrgEntitlement(params.organizationId, false)
      return updated
    }

    return this.prisma.socialListeningSubscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: true,
        autoRenewEnabled: false,
        cancelledBy: params.cancelledBy,
        cancelReason: params.cancelReason ?? null,
      },
    })
  }

  async toggleAutoRenew(
    organizationId: string,
    enabled: boolean,
    actor: SocialListeningSubscriptionCancelledBy,
  ) {
    const sub = await this.prisma.socialListeningSubscription.findUnique({
      where: { organizationId },
    })
    if (!sub) throw new NotFoundException('Subscription not found')
    if (sub.billingSource !== SocialListeningBillingSource.FYGARO) {
      throw new BadRequestException('Auto-renew only applies to Fygaro-billed subscriptions')
    }

    return this.prisma.socialListeningSubscription.update({
      where: { id: sub.id },
      data: {
        autoRenewEnabled: enabled,
        ...(enabled
          ? { cancelAtPeriodEnd: false, cancelledBy: null, cancelReason: null }
          : { cancelledBy: actor }),
      },
    })
  }

  async patchAdminSubscription(
    organizationId: string,
    data: {
      plan?: SocialListeningPlan
      extendMonths?: number
      autoRenewEnabled?: boolean
    },
  ) {
    const sub = await this.prisma.socialListeningSubscription.findUnique({
      where: { organizationId },
    })
    if (!sub) throw new NotFoundException('Subscription not found')

    let currentPeriodEnd = sub.currentPeriodEnd
    if (data.extendMonths) {
      const base = currentPeriodEnd && currentPeriodEnd.getTime() > Date.now()
        ? currentPeriodEnd
        : new Date()
      currentPeriodEnd = new Date(base)
      currentPeriodEnd.setUTCMonth(currentPeriodEnd.getUTCMonth() + data.extendMonths)
    }

    const updated = await this.prisma.socialListeningSubscription.update({
      where: { id: sub.id },
      data: {
        ...(data.plan ? { plan: data.plan } : {}),
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        ...(data.autoRenewEnabled !== undefined
          ? { autoRenewEnabled: data.autoRenewEnabled }
          : {}),
        ...(currentPeriodEnd && this.isEntitled({ ...sub, currentPeriodEnd })
          ? { status: SocialListeningSubscriptionStatus.ACTIVE }
          : {}),
      },
    })

    await this.syncOrgEntitlement(
      organizationId,
      this.isEntitled(updated),
    )
    return updated
  }

  async listAdminSubscriptions(filters?: {
    status?: SocialListeningSubscriptionStatus
    plan?: SocialListeningPlan
    expiringWithinDays?: number
    noActiveSetup?: boolean
  }) {
    const now = new Date()
    const expiringEnd = filters?.expiringWithinDays
      ? new Date(now.getTime() + filters.expiringWithinDays * 86400000)
      : undefined

    const subs = await this.prisma.socialListeningSubscription.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.plan ? { plan: filters.plan } : {}),
        ...(expiringEnd
          ? {
              currentPeriodEnd: { gte: now, lte: expiringEnd },
              status: SocialListeningSubscriptionStatus.ACTIVE,
            }
          : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand24ProjectId: true,
            isSocialListeningSubscriber: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!filters?.noActiveSetup) return subs

    const orgIdsWithSetup = new Set(
      (
        await this.prisma.socialListeningSetup.findMany({
          where: { status: 'ACTIVE' },
          select: { organizationId: true },
        })
      ).map((s) => s.organizationId),
    )

    return subs.filter((s) => !orgIdsWithSetup.has(s.organizationId))
  }

  async getAdminStats() {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 86400000)

    const [active, pending, expiringSoon, noSetup] = await Promise.all([
      this.prisma.socialListeningSubscription.count({
        where: { status: SocialListeningSubscriptionStatus.ACTIVE },
      }),
      this.prisma.socialListeningSubscription.count({
        where: { status: SocialListeningSubscriptionStatus.PENDING_PAYMENT },
      }),
      this.prisma.socialListeningSubscription.count({
        where: {
          status: SocialListeningSubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: now, lte: in7Days },
        },
      }),
      this.listAdminSubscriptions({ noActiveSetup: true, status: SocialListeningSubscriptionStatus.ACTIVE }).then(
        (s) => s.length,
      ),
    ])

    return { active, pending, expiringSoon, noSetup }
  }

  async recordPaymentEvent(params: {
    subscriptionId: string
    eventType: 'INITIAL' | 'RENEWAL' | 'MANUAL_RENEWAL' | 'UPDATE_PAYMENT'
    payload: FygaroWebhookPayload
  }) {
    const existing = await this.prisma.socialListeningPaymentEvent.findUnique({
      where: { fygaroTransactionId: params.payload.transactionId },
    })
    if (existing) return { duplicate: true as const, event: existing }

    const event = await this.prisma.socialListeningPaymentEvent.create({
      data: {
        subscriptionId: params.subscriptionId,
        eventType: params.eventType,
        fygaroTransactionId: params.payload.transactionId,
        amount: params.payload.amount ?? '0.00',
        currency: params.payload.currency ?? 'USD',
        rawPayload: params.payload as object,
      },
    })
    return { duplicate: false as const, event }
  }

  async getOwnerEmail(organizationId: string): Promise<string | null> {
    const owner = await this.prisma.user.findFirst({
      where: {
        organizationId,
        role: UserRole.CLIENT,
        clientOrgRole: ClientOrgRole.OWNER,
        status: UserStatus.ACTIVE,
      },
      select: { email: true },
    })
    return owner?.email ?? null
  }

  formatSubscriptionForClient(
    subscription: {
      plan: SocialListeningPlan
      status: SocialListeningSubscriptionStatus
      startedAt: Date | null
      currentPeriodEnd: Date | null
      autoRenewEnabled: boolean
      cancelAtPeriodEnd: boolean
      billingSource: SocialListeningBillingSource
      paymentMethodLast4: string | null
      paymentMethodBrand: string | null
      paymentMethodExpMonth: number | null
      paymentMethodExpYear: number | null
    } | null,
  ): ClientSubscriptionView | null {
    if (!subscription) return null
    const planDef = getPlanByPrismaPlan(subscription.plan)
    return {
      plan: subscription.plan,
      planId: planDef?.id ?? null,
      planName: planDef?.name ?? subscription.plan,
      status: subscription.status,
      startedAt: subscription.startedAt?.toISOString() ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      autoRenewEnabled: subscription.autoRenewEnabled,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      billingSource: subscription.billingSource,
      entitled: this.isEntitled(subscription),
      paymentMethod: subscription.paymentMethodLast4
        ? {
            last4: subscription.paymentMethodLast4,
            brand: subscription.paymentMethodBrand,
            expMonth: subscription.paymentMethodExpMonth,
            expYear: subscription.paymentMethodExpYear,
          }
        : null,
    }
  }

  private cardFieldsFromPayload(payload: FygaroWebhookPayload) {
    const card = payload.card
    if (!card?.last4) return {}
    return {
      paymentMethodLast4: card.last4,
      paymentMethodBrand: card.brand ?? null,
      paymentMethodExpMonth: card.expMonth ?? null,
      paymentMethodExpYear: card.expYear ?? null,
    }
  }
}
