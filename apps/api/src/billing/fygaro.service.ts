import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'node:crypto'
import {
  buildFygaroCustomReference,
  formatPlanAmount,
  getPlanByPrismaPlan,
  planIdToPrismaPlan,
  type SocialListeningPlanId,
} from '@cocreate/social-listening-plans'
import type { SocialListeningPlan } from '@cocreate/database'

type CheckoutEventType = 'initial' | 'renewal' | 'manual_renewal' | 'update_payment'

@Injectable()
export class FygaroService {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getSecret() && this.getPaymentButtonUrl())
  }

  buildCheckoutUrl(params: {
    subscriptionId: string
    plan: SocialListeningPlan
    eventType: CheckoutEventType
  }): string {
    const secret = this.getSecret()
    const baseUrl = this.getPaymentButtonUrl()
    if (!secret || !baseUrl) {
      throw new BadRequestException('Fygaro is not configured')
    }

    const planDef = getPlanByPrismaPlan(params.plan)
    if (!planDef) {
      throw new BadRequestException('Unknown subscription plan')
    }

    const customReference = buildFygaroCustomReference(
      params.subscriptionId,
      params.eventType,
    )

    const clientPortalUrl =
      this.config.get<string>('CLIENT_PORTAL_URL')?.trim() ||
      process.env.CLIENT_PORTAL_URL?.trim() ||
      'http://localhost:3003'

    const payload = {
      amount: formatPlanAmount(planDef),
      currency: planDef.currency,
      custom_reference: customReference,
      return_url: `${clientPortalUrl.replace(/\/$/, '')}/?tab=social-listening&billing=success`,
    }

    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: this.getKeyId() ?? undefined }),
    ).toString('base64url')

    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url')

    const jwt = `${header}.${body}.${signature}`
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}jwt=${encodeURIComponent(jwt)}`
  }

  buildCheckoutUrlForPlanId(params: {
    subscriptionId: string
    planId: SocialListeningPlanId
    eventType: CheckoutEventType
  }): string {
    return this.buildCheckoutUrl({
      subscriptionId: params.subscriptionId,
      plan: planIdToPrismaPlan(params.planId),
      eventType: params.eventType,
    })
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string, keyIdHeader: string): boolean {
    const secrets = this.getWebhookSecrets()
    if (!secrets.length) return false

    const secret = secrets.find((_, i) => !this.getKeyId() || keyIdHeader === this.getKeyId()) ?? secrets[0]
    if (!secret) return false

    let timestamp: string | null = null
    const hashes: string[] = []
    for (const part of signatureHeader.split(',')) {
      const [k, v] = part.trim().split('=')
      if (k === 't') timestamp = v ?? null
      if (k === 'v1' && v) hashes.push(v)
    }
    if (!timestamp || !hashes.length) return false

    const ts = Number.parseInt(timestamp, 10)
    if (Number.isFinite(ts) && Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) {
      return false
    }

    const message = `${timestamp}.${rawBody.toString('utf8')}`
    const expected = createHmac('sha256', secret).update(message).digest('hex')

    return hashes.some((h) => timingSafeEqualHex(expected, h))
  }

  private getSecret(): string | undefined {
    return (
      this.config.get<string>('FYGARO_SECRET')?.trim() ||
      process.env.FYGARO_SECRET?.trim() ||
      undefined
    )
  }

  private getKeyId(): string | undefined {
    return (
      this.config.get<string>('FYGARO_KEY_ID')?.trim() ||
      process.env.FYGARO_KEY_ID?.trim() ||
      undefined
    )
  }

  private getPaymentButtonUrl(): string | undefined {
    return (
      this.config.get<string>('FYGARO_PAYMENT_BUTTON_URL')?.trim() ||
      process.env.FYGARO_PAYMENT_BUTTON_URL?.trim() ||
      undefined
    )
  }

  private getWebhookSecrets(): string[] {
    const raw =
      this.config.get<string>('FYGARO_WEBHOOK_SECRETS')?.trim() ||
      process.env.FYGARO_WEBHOOK_SECRETS?.trim() ||
      this.getSecret() ||
      ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
