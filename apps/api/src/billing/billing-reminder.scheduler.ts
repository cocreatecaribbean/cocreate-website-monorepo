import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SocialListeningSubscriptionStatus } from '@cocreate/database'
import { FygaroService } from './fygaro.service'
import { ResendBillingService } from './resend-billing.service'
import { SubscriptionService } from './subscription.service'

@Injectable()
export class BillingReminderScheduler {
  private readonly logger = new Logger(BillingReminderScheduler.name)

  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly billingEmail: ResendBillingService,
    private readonly fygaro: FygaroService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendRenewalReminders(): Promise<void> {
    if (!this.billingEmail.isConfigured()) return

    const subs = await this.subscriptions.listAdminSubscriptions({
      status: SocialListeningSubscriptionStatus.ACTIVE,
    })

    const now = new Date()
    const portalBase = this.billingEmail.getClientPortalUrl().replace(/\/$/, '')

    for (const sub of subs) {
      if (!sub.currentPeriodEnd) continue
      const ownerEmail = await this.subscriptions.getOwnerEmail(sub.organizationId)
      if (!ownerEmail) continue

      const daysUntil = Math.ceil(
        (sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000,
      )

      if (sub.autoRenewEnabled) {
        if (daysUntil === 7 || daysUntil === 3) {
          await this.billingEmail.sendAutoRenewUpcoming({
            subscriptionId: sub.id,
            periodEnd: sub.currentPeriodEnd,
            to: ownerEmail,
            plan: sub.plan,
            daysUntil,
            last4: sub.paymentMethodLast4,
          })
        }
      } else {
        if (daysUntil === 14) {
          await this.billingEmail.sendEnableAutoRenewNudge({
            subscriptionId: sub.id,
            periodEnd: sub.currentPeriodEnd,
            to: ownerEmail,
            enableAutoRenewUrl: `${portalBase}/?tab=social-listening&billing=auto-renew`,
          })
        }
        if (daysUntil === 7 || daysUntil === 3 || daysUntil === 1) {
          let renewUrl = `${portalBase}/?tab=social-listening&billing=renew`
          if (this.fygaro.isConfigured()) {
            try {
              renewUrl = this.fygaro.buildCheckoutUrl({
                subscriptionId: sub.id,
                plan: sub.plan,
                eventType: 'manual_renewal',
              })
            } catch {
              /* use portal fallback */
            }
          }
          await this.billingEmail.sendManualRenewReminder({
            subscriptionId: sub.id,
            periodEnd: sub.currentPeriodEnd,
            to: ownerEmail,
            plan: sub.plan,
            daysUntil,
            renewUrl,
            enableAutoRenewUrl: `${portalBase}/?tab=social-listening&billing=auto-renew`,
          })
        }
      }
    }

    this.logger.log('Billing renewal reminders processed')
  }
}

@Injectable()
export class SubscriptionExpiryScheduler {
  private readonly logger = new Logger(SubscriptionExpiryScheduler.name)

  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly billingEmail: ResendBillingService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async expireSubscriptions(): Promise<void> {
    const expiredCount = await this.subscriptions.expireDueSubscriptions()
    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} subscription(s)`)
    }

    if (!this.billingEmail.isConfigured()) return

    const expired = await this.subscriptions.listAdminSubscriptions({
      status: SocialListeningSubscriptionStatus.EXPIRED,
    })

    for (const sub of expired) {
      if (!sub.currentPeriodEnd) continue
      const ownerEmail = await this.subscriptions.getOwnerEmail(sub.organizationId)
      if (!ownerEmail) continue
      await this.billingEmail.sendSubscriptionExpired({
        subscriptionId: sub.id,
        periodEnd: sub.currentPeriodEnd,
        to: ownerEmail,
      })
    }
  }
}
