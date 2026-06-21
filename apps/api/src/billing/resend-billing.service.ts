import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  SocialListeningBillingEmailType,
  SocialListeningPlan,
} from '@cocreate/database'
import { getPlanByPrismaPlan } from '@cocreate/social-listening-plans'
import { Resend } from 'resend'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ResendBillingService implements OnModuleInit {
  private readonly logger = new Logger(ResendBillingService.name)
  private client: Resend | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const key = this.getApiKey()
    this.client = key ? new Resend(key) : null
    if (this.isConfigured()) {
      this.logger.log(`Billing emails via Resend from ${this.getFromAddress()}`)
    }
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey() && this.getFromEmail())
  }

  private getApiKey(): string | undefined {
    return (
      this.config.get<string>('RESEND_API_KEY')?.trim() ||
      process.env.RESEND_API_KEY?.trim() ||
      undefined
    )
  }

  getFromEmail(): string | null {
    return (
      this.config.get<string>('BILLING_FROM_EMAIL')?.trim() ||
      process.env.BILLING_FROM_EMAIL?.trim() ||
      'billingupdates@mail.cocreatecaribbean.com'
    )
  }

  getFromAddress(): string {
    const email = this.getFromEmail()
    if (!email) {
      throw new BadRequestException('BILLING_FROM_EMAIL is not configured')
    }
    const name =
      this.config.get<string>('BILLING_FROM_NAME')?.trim() ||
      process.env.BILLING_FROM_NAME?.trim() ||
      'CoCreate Billing'
    return `${name} <${email}>`
  }

  getClientPortalUrl(): string {
    return (
      this.config.get<string>('CLIENT_PORTAL_URL')?.trim() ||
      process.env.CLIENT_PORTAL_URL?.trim() ||
      'http://localhost:3003'
    )
  }

  async sendAndLog(params: {
    subscriptionId: string
    emailType: SocialListeningBillingEmailType
    periodEnd: Date
    to: string
    subject: string
    html: string
    text: string
  }): Promise<boolean> {
    const existing = await this.prisma.socialListeningBillingEmailLog.findUnique({
      where: {
        subscriptionId_emailType_periodEnd: {
          subscriptionId: params.subscriptionId,
          emailType: params.emailType,
          periodEnd: params.periodEnd,
        },
      },
    })
    if (existing) return false

    if (!this.isConfigured()) {
      this.logger.warn(`Billing email skipped (${params.emailType}): Resend not configured`)
      return false
    }

    const resend = this.ensureClient()
    const from = this.getFromAddress()
    const { data, error } = await resend.emails.send({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (error) {
      this.logger.error(`Billing email failed (${params.emailType}): ${error.message}`)
      return false
    }

    await this.prisma.socialListeningBillingEmailLog.create({
      data: {
        subscriptionId: params.subscriptionId,
        emailType: params.emailType,
        periodEnd: params.periodEnd,
        recipientEmail: params.to,
        resendMessageId: data?.id ?? null,
      },
    })

    this.logger.log(`Billing email sent (${params.emailType}) to ${params.to}`)
    return true
  }

  async sendSubscriptionActivated(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    plan: SocialListeningPlan
    organizationName: string
  }) {
    const planDef = getPlanByPrismaPlan(params.plan)
    const portalUrl = this.getClientPortalUrl()
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.SUBSCRIPTION_ACTIVATED,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: `Social Listening activated — ${planDef?.name ?? params.plan}`,
      html: `
        <p>Your Social Listening subscription for <strong>${params.organizationName}</strong> is now active.</p>
        <p>Plan: <strong>${planDef?.name ?? params.plan}</strong> (${planDef?.priceLabel ?? ''}${planDef?.periodLabel ?? ''})</p>
        <p>Renews on: <strong>${params.periodEnd.toLocaleDateString('en-US', { timeZone: 'UTC' })}</strong></p>
        <p><a href="${portalUrl}">Open client portal</a></p>
      `.trim(),
      text: `Social Listening is active for ${params.organizationName}. Plan: ${planDef?.name ?? params.plan}. Renews ${params.periodEnd.toISOString().slice(0, 10)}. Portal: ${portalUrl}`,
    })
  }

  async sendAutoRenewUpcoming(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    plan: SocialListeningPlan
    daysUntil: number
    last4?: string | null
  }) {
    const planDef = getPlanByPrismaPlan(params.plan)
    const amount = planDef ? `${planDef.priceLabel}${planDef.periodLabel}` : ''
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.AUTO_RENEW_UPCOMING,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: `Social Listening renews in ${params.daysUntil} day${params.daysUntil === 1 ? '' : 's'}`,
      html: `
        <p>Your <strong>${planDef?.name ?? params.plan}</strong> plan will automatically renew in ${params.daysUntil} day${params.daysUntil === 1 ? '' : 's'}.</p>
        <p>Amount: <strong>${amount}</strong></p>
        ${params.last4 ? `<p>Card on file: ending in ${params.last4}</p>` : ''}
        <p>Renewal date: <strong>${params.periodEnd.toLocaleDateString('en-US', { timeZone: 'UTC' })}</strong></p>
      `.trim(),
      text: `Auto-renew in ${params.daysUntil} days. Plan ${planDef?.name ?? params.plan}. Amount ${amount}.`,
    })
  }

  async sendManualRenewReminder(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    plan: SocialListeningPlan
    daysUntil: number
    renewUrl: string
    enableAutoRenewUrl: string
  }) {
    const planDef = getPlanByPrismaPlan(params.plan)
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.MANUAL_RENEW_REMINDER,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: `Renew Social Listening — ${daysLabel(params.daysUntil)} left`,
      html: `
        <p>Your Social Listening subscription expires in ${params.daysUntil} day${params.daysUntil === 1 ? '' : 's'}.</p>
        <p>Plan: <strong>${planDef?.name ?? params.plan}</strong></p>
        <p><a href="${params.renewUrl}">Renew now</a></p>
        <p>Save time next month — <a href="${params.enableAutoRenewUrl}">turn on auto-renew</a>.</p>
      `.trim(),
      text: `Renew Social Listening (${planDef?.name ?? params.plan}): ${params.renewUrl}. Turn on auto-renew: ${params.enableAutoRenewUrl}`,
    })
  }

  async sendEnableAutoRenewNudge(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    enableAutoRenewUrl: string
  }) {
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.ENABLE_AUTO_RENEW_NUDGE,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: 'Turn on auto-renew for Social Listening',
      html: `
        <p>Auto-renew is currently off for your Social Listening subscription.</p>
        <p><a href="${params.enableAutoRenewUrl}">Enable auto-renew</a> so your monitoring stays uninterrupted.</p>
      `.trim(),
      text: `Enable auto-renew: ${params.enableAutoRenewUrl}`,
    })
  }

  async sendAutoRenewSuccess(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    plan: SocialListeningPlan
  }) {
    const planDef = getPlanByPrismaPlan(params.plan)
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.AUTO_RENEW_SUCCESS,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: 'Social Listening renewed successfully',
      html: `
        <p>Your <strong>${planDef?.name ?? params.plan}</strong> subscription renewed successfully.</p>
        <p>Next renewal: <strong>${params.periodEnd.toLocaleDateString('en-US', { timeZone: 'UTC' })}</strong></p>
      `.trim(),
      text: `Renewed ${planDef?.name ?? params.plan}. Next renewal ${params.periodEnd.toISOString().slice(0, 10)}.`,
    })
  }

  async sendAutoRenewFailed(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    updatePaymentUrl: string
  }) {
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.AUTO_RENEW_FAILED,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: 'Social Listening payment failed',
      html: `
        <p>We could not process your Social Listening renewal.</p>
        <p><a href="${params.updatePaymentUrl}">Update payment method</a> to keep your subscription active.</p>
      `.trim(),
      text: `Payment failed. Update payment: ${params.updatePaymentUrl}`,
    })
  }

  async sendSubscriptionExpired(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
  }) {
    const portalUrl = this.getClientPortalUrl()
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.SUBSCRIPTION_EXPIRED,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: 'Social Listening subscription expired',
      html: `
        <p>Your Social Listening subscription has expired.</p>
        <p><a href="${portalUrl}">Resubscribe in the client portal</a></p>
      `.trim(),
      text: `Subscription expired. Resubscribe: ${portalUrl}`,
    })
  }

  async sendSubscriptionCancelled(params: {
    subscriptionId: string
    periodEnd: Date
    to: string
    atPeriodEnd: boolean
  }) {
    return this.sendAndLog({
      subscriptionId: params.subscriptionId,
      emailType: SocialListeningBillingEmailType.SUBSCRIPTION_CANCELLED,
      periodEnd: params.periodEnd,
      to: params.to,
      subject: 'Social Listening subscription cancelled',
      html: params.atPeriodEnd
        ? `<p>Your subscription will end on <strong>${params.periodEnd.toLocaleDateString('en-US', { timeZone: 'UTC' })}</strong>.</p>`
        : `<p>Your Social Listening subscription has been cancelled.</p>`,
      text: params.atPeriodEnd
        ? `Subscription ends ${params.periodEnd.toISOString().slice(0, 10)}.`
        : 'Subscription cancelled.',
    })
  }

  private ensureClient(): Resend {
    const key = this.getApiKey()
    if (!key) throw new BadRequestException('RESEND_API_KEY is not configured')
    if (!this.client) this.client = new Resend(key)
    return this.client
  }
}

function daysLabel(days: number): string {
  return `${days} day${days === 1 ? '' : 's'}`
}
