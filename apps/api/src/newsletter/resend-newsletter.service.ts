import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class ResendNewsletterService implements OnModuleInit {
  private readonly logger = new Logger(ResendNewsletterService.name)
  private client: Resend | null = null
  private loggedLegacyAudienceWarning = false

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const key = this.getApiKey()
    this.client = key ? new Resend(key) : null
    if (this.isEmailConfigured()) {
      this.logger.log(`Newsletter emails via Resend from ${this.getFromAddress()}`)
    }
    if (this.getSegmentId()) {
      this.logger.log('Newsletter contacts sync to Resend segment')
    } else if (this.getLegacyAudienceId()) {
      this.logLegacyAudienceDeprecation()
    }
  }

  private env(key: string): string | undefined {
    return (
      this.config.get<string>(key)?.trim() || process.env[key]?.trim() || undefined
    )
  }

  private getApiKey(): string | undefined {
    return this.env('RESEND_API_KEY')
  }

  /** Primary: Resend Dashboard → Segments → copy segment ID. */
  getSegmentId(): string | null {
    return this.env('RESEND_SEGMENT_ID') ?? null
  }

  /** @deprecated Use RESEND_SEGMENT_ID. Resend Dashboard → Audiences (legacy API). */
  private getLegacyAudienceId(): string | null {
    return this.env('RESEND_AUDIENCE_ID') ?? null
  }

  isEmailConfigured(): boolean {
    return Boolean(this.getApiKey() && this.getFromEmail())
  }

  /** True when confirmed subscribers can be synced to a Resend segment (or legacy audience). */
  isResendListConfigured(): boolean {
    return Boolean(
      this.getApiKey() && (this.getSegmentId() || this.getLegacyAudienceId()),
    )
  }

  private logLegacyAudienceDeprecation(): void {
    if (this.loggedLegacyAudienceWarning) return
    this.loggedLegacyAudienceWarning = true
    this.logger.warn(
      'RESEND_AUDIENCE_ID is deprecated — use RESEND_SEGMENT_ID (Resend Dashboard → Segments). Legacy audience sync remains enabled.',
    )
  }

  getFromEmail(): string | null {
    return (
      this.env('NEWSLETTER_FROM_EMAIL') ??
      this.env('AUTH_EMAIL_FROM') ??
      this.env('RESEND_FROM_EMAIL') ??
      null
    )
  }

  getFromAddress(): string {
    const email = this.getFromEmail()
    if (!email) {
      throw new BadRequestException('Newsletter sender email is not configured')
    }
    const name =
      this.env('NEWSLETTER_FROM_NAME') ??
      this.env('AUTH_EMAIL_FROM_NAME') ??
      'CoCreate Caribbean'
    return `${name} <${email}>`
  }

  getWebUrl(): string {
    return this.env('WEB_URL') ?? 'http://localhost:3000'
  }

  private ensureClient(): Resend {
    const key = this.getApiKey()
    if (!key) {
      throw new BadRequestException('RESEND_API_KEY is not configured')
    }
    if (!this.client) {
      this.client = new Resend(key)
    }
    return this.client
  }

  async sendConfirmationEmail(params: {
    to: string
    confirmUrl: string
  }): Promise<void> {
    const resend = this.ensureClient()
    const from = this.getFromAddress()

    const { error } = await resend.emails.send({
      from,
      to: [params.to],
      subject: 'Confirm your CoCreate mailing list subscription',
      html: `
        <p>Thanks for your interest in CoCreate Caribbean.</p>
        <p>Please confirm you want to join our mailing list:</p>
        <p><a href="${params.confirmUrl}">Confirm subscription</a></p>
        <p style="color:#64748b;font-size:12px;">This link expires in 48 hours. If you did not request this, you can ignore this email.</p>
      `.trim(),
      text: `Thanks for your interest in CoCreate Caribbean.\n\nConfirm your subscription: ${params.confirmUrl}\n\nThis link expires in 48 hours. If you did not request this, you can ignore this email.`,
    })

    if (error) {
      this.logger.error(`Newsletter confirmation email failed: ${error.message}`)
      throw new BadRequestException(`Resend: ${error.message}`)
    }

    this.logger.log(`Newsletter confirmation email sent to ${params.to}`)
  }

  async addConfirmedContact(email: string): Promise<string | null> {
    const segmentId = this.getSegmentId()
    const legacyAudienceId = this.getLegacyAudienceId()

    if (!segmentId && !legacyAudienceId) {
      this.logger.warn(
        'RESEND_SEGMENT_ID not set — subscriber confirmed in DB only',
      )
      return null
    }

    if (segmentId && legacyAudienceId) {
      this.logger.warn(
        'RESEND_AUDIENCE_ID is ignored when RESEND_SEGMENT_ID is set',
      )
    }

    const resend = this.ensureClient()
    const createPayload = segmentId
      ? {
          email,
          unsubscribed: false as const,
          segments: [{ id: segmentId }],
        }
      : (() => {
          this.logLegacyAudienceDeprecation()
          return {
            email,
            unsubscribed: false as const,
            audienceId: legacyAudienceId!,
          }
        })()

    const { data, error } = await resend.contacts.create(createPayload)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists')) {
        this.logger.log(`Resend contact already exists for ${email}`)
        return null
      }
      this.logger.error(`Resend contact create failed: ${error.message}`)
      throw new BadRequestException(`Resend: ${error.message}`)
    }

    return data?.id ?? null
  }
}
