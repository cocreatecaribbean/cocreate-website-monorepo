import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

export type AuthEmailKind = 'invite' | 'magiclink'

@Injectable()
export class ResendAuthMailService implements OnModuleInit {
  private readonly logger = new Logger(ResendAuthMailService.name)
  private client: Resend | null = null

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const key = this.getApiKey()
    this.client = key ? new Resend(key) : null
    if (this.isConfigured()) {
      this.logger.log(`Auth emails via Resend from ${this.getFromAddress()}`)
    } else if (key) {
      this.logger.warn(
        'RESEND_API_KEY is set but AUTH_EMAIL_FROM is missing — Resend auth emails disabled',
      )
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

  isConfigured(): boolean {
    return Boolean(this.getApiKey() && this.getFromEmail())
  }

  getFromEmail(): string | null {
    return this.env('AUTH_EMAIL_FROM') ?? this.env('RESEND_FROM_EMAIL') ?? null
  }

  /** Resend format: `CoCreate Caribbean <no-reply@mail.cocreatecaribbean.com>` */
  getFromAddress(): string {
    const email = this.getFromEmail()
    if (!email) {
      throw new BadRequestException(
        'AUTH_EMAIL_FROM (or RESEND_FROM_EMAIL) is not configured',
      )
    }
    const name = this.env('AUTH_EMAIL_FROM_NAME') || 'CoCreate Caribbean'
    return `${name} <${email}>`
  }

  async sendSignInEmail(params: {
    to: string
    actionLink: string
    kind: AuthEmailKind
    projectTitle?: string
    organizationName?: string
    inviteContext?: 'new_project' | 'invite_reminder'
  }): Promise<void> {
    const key = this.getApiKey()
    if (!key) {
      throw new BadRequestException('RESEND_API_KEY is not configured')
    }
    if (!this.client) {
      this.client = new Resend(key)
    }

    const from = this.getFromAddress()
    const orgSuffix = params.organizationName
      ? ` for ${params.organizationName}`
      : ''

    let subject: string
    let intro: string

    if (params.projectTitle && params.inviteContext) {
      subject = `Accept your invite to view “${params.projectTitle}”`
      if (params.inviteContext === 'new_project') {
        intro = `You’ve been invited to the CoCreate client portal${orgSuffix}. Accept your invite to sign in and view the new project “${params.projectTitle}”.`
      } else {
        intro = `Your CoCreate portal invite is still pending${orgSuffix}. Accept your invite to sign in and view the new project “${params.projectTitle}”.`
      }
    } else if (params.kind === 'invite') {
      subject = 'You’re invited to the CoCreate client portal'
      intro = `You’ve been invited to access your CoCreate client portal${orgSuffix}.`
    } else {
      subject = 'Your CoCreate sign-in link'
      intro = 'Use the link below to sign in to your CoCreate client portal.'
    }

    const { error } = await this.client.emails.send({
      from,
      to: [params.to],
      subject,
      html: `
        <p>${intro}</p>
        <p><a href="${params.actionLink}">Sign in to CoCreate</a></p>
        <p style="color:#64748b;font-size:12px;">This link expires soon and can only be used once. If you didn’t request this, you can ignore this email.</p>
      `.trim(),
      text: `${intro}\n\nSign in: ${params.actionLink}\n\nThis link expires soon and can only be used once.`,
    })

    if (error) {
      this.logger.error(`Resend send failed: ${error.message}`)
      throw new BadRequestException(`Resend: ${error.message}`)
    }

    this.logger.log(
      `[invite] Sent ${params.kind} email via Resend from ${from} to ${params.to}`,
    )
  }

  /**
   * Transactional notice when an existing client is attached to another org.
   * Not an Auth invite — they already have an account.
   */
  async sendMembershipAddedEmail(params: {
    to: string
    organizationName: string
    roleLabel: string
    portalUrl: string
  }): Promise<'sent' | 'skipped'> {
    const key = this.getApiKey()
    if (!key || !this.getFromEmail()) {
      this.logger.warn(
        `[membership-added] skipped (set RESEND_API_KEY + AUTH_EMAIL_FROM): ${params.to}`,
      )
      return 'skipped'
    }
    if (!this.client) {
      this.client = new Resend(key)
    }

    const from = this.getFromAddress()
    const subject = `You’ve been added to ${params.organizationName}`
    const intro = `You’ve been added to ${params.organizationName} on the CoCreate client portal as ${params.roleLabel}. Sign in with your existing account to open this workspace.`

    const { error } = await this.client.emails.send({
      from,
      to: [params.to],
      subject,
      html: `
        <p>${intro}</p>
        <p><a href="${params.portalUrl}">Open CoCreate portal</a></p>
        <p style="color:#64748b;font-size:12px;">If you didn’t expect this, you can ignore this email or contact your CoCreate admin.</p>
      `.trim(),
      text: `${intro}\n\nOpen portal: ${params.portalUrl}\n`,
    })

    if (error) {
      this.logger.error(`Resend membership-added send failed: ${error.message}`)
      return 'skipped'
    }

    this.logger.log(
      `[membership-added] Sent email via Resend from ${from} to ${params.to}`,
    )
    return 'sent'
  }
}
