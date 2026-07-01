import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  VERSION_NEUTRAL,
} from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { parseFygaroCustomReference } from '@cocreate/social-listening-plans'
import { FygaroService } from './fygaro.service'
import { ResendBillingService } from './resend-billing.service'
import { SubscriptionService, type FygaroWebhookPayload } from './subscription.service'

@Controller({ path: 'webhooks', version: VERSION_NEUTRAL })
export class FygaroWebhookController {
  private readonly logger = new Logger(FygaroWebhookController.name)

  constructor(
    private readonly fygaro: FygaroService,
    private readonly subscriptions: SubscriptionService,
    private readonly billingEmail: ResendBillingService,
  ) {}

  @Post('fygaro')
  @HttpCode(200)
  async handleFygaroWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('fygaro-signature') signatureHeader?: string,
    @Headers('fygaro-key-id') keyIdHeader?: string,
  ) {
    const rawBody = req.rawBody
    if (!rawBody) {
      this.logger.error('Missing raw body for Fygaro webhook')
      throw new UnauthorizedException('Invalid webhook payload')
    }

    if (
      !signatureHeader ||
      !this.fygaro.verifyWebhookSignature(rawBody, signatureHeader, keyIdHeader ?? '')
    ) {
      throw new UnauthorizedException('Invalid Fygaro signature')
    }

    let payload: FygaroWebhookPayload
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as FygaroWebhookPayload
    } catch {
      throw new UnauthorizedException('Invalid JSON payload')
    }

    if (!payload.transactionId) {
      return { ok: true, skipped: 'missing_transaction_id' }
    }

    const parsed = parseFygaroCustomReference(payload.customReference)
    if (!parsed) {
      this.logger.warn(`Unrecognized customReference: ${payload.customReference}`)
      return { ok: true, skipped: 'unknown_reference' }
    }

    const prismaEventType = mapEventType(parsed.eventType)
    if (
      parsed.eventType === 'renewal_failed' ||
      parsed.eventType === 'payment_failed'
    ) {
      const sub = await this.subscriptions.getById(parsed.subscriptionId)
      await this.subscriptions.markPastDue(parsed.subscriptionId)
      const failedOwnerEmail = await this.subscriptions.getOwnerEmail(sub.organizationId)
      if (failedOwnerEmail && sub.currentPeriodEnd) {
        const portalBase = this.billingEmail.getClientPortalUrl().replace(/\/$/, '')
        await this.billingEmail.sendAutoRenewFailed({
          subscriptionId: sub.id,
          periodEnd: sub.currentPeriodEnd,
          to: failedOwnerEmail,
          updatePaymentUrl: `${portalBase}/?tab=social-listening&billing=update-payment`,
        })
      }
      return { ok: true, handled: 'payment_failed' }
    }

    if (!prismaEventType) {
      return { ok: true, skipped: 'unknown_event_type' }
    }

    const { duplicate } = await this.subscriptions.recordPaymentEvent({
      subscriptionId: parsed.subscriptionId,
      eventType: prismaEventType,
      payload,
    })
    if (duplicate) {
      return { ok: true, duplicate: true }
    }

    const sub = await this.subscriptions.getById(parsed.subscriptionId)
    const ownerEmail = await this.subscriptions.getOwnerEmail(sub.organizationId)

    if (parsed.eventType === 'initial' || parsed.eventType === 'manual_renewal') {
      const updated = await this.subscriptions.activateFromPayment(
        parsed.subscriptionId,
        payload,
        parsed.eventType === 'initial' ? 'INITIAL' : 'MANUAL_RENEWAL',
      )
      if (ownerEmail && updated.currentPeriodEnd) {
        if (parsed.eventType === 'initial') {
          await this.billingEmail.sendSubscriptionActivated({
            subscriptionId: updated.id,
            periodEnd: updated.currentPeriodEnd,
            to: ownerEmail,
            plan: updated.plan,
            organizationName: sub.organization.name,
          })
        }
      }
    } else if (parsed.eventType === 'renewal') {
      const updated = await this.subscriptions.extendPeriod(parsed.subscriptionId, payload)
      if (ownerEmail && updated.currentPeriodEnd) {
        await this.billingEmail.sendAutoRenewSuccess({
          subscriptionId: updated.id,
          periodEnd: updated.currentPeriodEnd,
          to: ownerEmail,
          plan: updated.plan,
        })
      }
    } else if (parsed.eventType === 'update_payment') {
      await this.subscriptions.updatePaymentMethod(parsed.subscriptionId, payload)
    }

    return { ok: true }
  }
}

function mapEventType(
  eventType: string,
): 'INITIAL' | 'RENEWAL' | 'MANUAL_RENEWAL' | 'UPDATE_PAYMENT' | null {
  switch (eventType) {
    case 'initial':
      return 'INITIAL'
    case 'renewal':
      return 'RENEWAL'
    case 'manual_renewal':
      return 'MANUAL_RENEWAL'
    case 'update_payment':
      return 'UPDATE_PAYMENT'
    default:
      return null
  }
}
