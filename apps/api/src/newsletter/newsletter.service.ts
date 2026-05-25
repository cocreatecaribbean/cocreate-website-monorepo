import { createHash, randomBytes } from 'node:crypto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { NewsletterStatus } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import { ResendNewsletterService } from './resend-newsletter.service'

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000
const RESEND_COOLDOWN_MS = 15 * 60 * 1000

const GENERIC_SUCCESS_MESSAGE =
  'Thanks! If this email is eligible, check your inbox to confirm your subscription.'

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendNewsletter: ResendNewsletterService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url')
  }

  private buildConfirmUrl(rawToken: string): string {
    const base = this.resendNewsletter.getWebUrl().replace(/\/$/, '')
    return `${base}/newsletter/confirm?token=${encodeURIComponent(rawToken)}`
  }

  private buildRedirect(path: string): string {
    const base = this.resendNewsletter.getWebUrl().replace(/\/$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }

  async subscribe(email: string): Promise<{ ok: true; message: string }> {
    const normalized = this.normalizeEmail(email)

    if (!this.resendNewsletter.isEmailConfigured()) {
      throw new BadRequestException(
        'Newsletter signup is not configured. Set RESEND_API_KEY and sender email.',
      )
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalized },
    })

    if (existing?.status === NewsletterStatus.CONFIRMED) {
      if (
        !existing.resendContactId &&
        this.resendNewsletter.isResendListConfigured()
      ) {
        try {
          const resendContactId =
            await this.resendNewsletter.addConfirmedContact(normalized)
          if (resendContactId) {
            await this.prisma.newsletterSubscriber.update({
              where: { email: normalized },
              data: { resendContactId },
            })
            this.logger.log(
              `Newsletter Resend sync completed for ${normalized}`,
            )
          }
        } catch (err) {
          this.logger.error(
            `Newsletter Resend sync failed for ${normalized}`,
            err,
          )
        }
      }
      return { ok: true, message: GENERIC_SUCCESS_MESSAGE }
    }

    const now = Date.now()
    if (
      existing?.status === NewsletterStatus.PENDING &&
      existing.confirmTokenExpiresAt &&
      existing.confirmTokenExpiresAt.getTime() > now &&
      existing.updatedAt.getTime() > now - RESEND_COOLDOWN_MS
    ) {
      return { ok: true, message: GENERIC_SUCCESS_MESSAGE }
    }

    const rawToken = this.generateToken()
    const confirmTokenHash = this.hashToken(rawToken)
    const confirmTokenExpiresAt = new Date(now + TOKEN_TTL_MS)

    await this.prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: {
        email: normalized,
        status: NewsletterStatus.PENDING,
        confirmTokenHash,
        confirmTokenExpiresAt,
        source: 'footer',
      },
      update: {
        status: NewsletterStatus.PENDING,
        confirmTokenHash,
        confirmTokenExpiresAt,
        confirmedAt: null,
        resendContactId: null,
      },
    })

    await this.resendNewsletter.sendConfirmationEmail({
      to: normalized,
      confirmUrl: this.buildConfirmUrl(rawToken),
    })

    this.logger.log(`Newsletter pending signup: ${normalized}`)

    return { ok: true, message: GENERIC_SUCCESS_MESSAGE }
  }

  async confirm(token: string): Promise<string> {
    const trimmed = token?.trim()
    if (!trimmed) {
      return this.buildRedirect('/newsletter/confirm-error?reason=missing')
    }

    const confirmTokenHash = this.hashToken(trimmed)
    const subscriber = await this.prisma.newsletterSubscriber.findFirst({
      where: { confirmTokenHash },
    })

    if (!subscriber) {
      return this.buildRedirect('/newsletter/confirm-error?reason=invalid')
    }

    if (
      !subscriber.confirmTokenExpiresAt ||
      subscriber.confirmTokenExpiresAt.getTime() < Date.now()
    ) {
      return this.buildRedirect('/newsletter/confirm-error?reason=expired')
    }

    const needsResendSync =
      !subscriber.resendContactId && this.resendNewsletter.isResendListConfigured()
    const isResendRetry = subscriber.status === NewsletterStatus.CONFIRMED

    if (subscriber.status === NewsletterStatus.CONFIRMED && !needsResendSync) {
      return this.buildRedirect('/newsletter/confirmed')
    }

    let resendContactId: string | null = subscriber.resendContactId
    if (needsResendSync) {
      try {
        resendContactId =
          (await this.resendNewsletter.addConfirmedContact(subscriber.email)) ??
          resendContactId
        if (!resendContactId && isResendRetry) {
          this.logger.warn(
            `Resend contact not created for ${subscriber.email} — check RESEND_SEGMENT_ID and restart the API after changing .env`,
          )
          return this.buildRedirect('/newsletter/confirm-error?reason=sync')
        }
      } catch (err) {
        this.logger.error(
          `Resend segment sync failed for ${subscriber.email}`,
          err,
        )
        return this.buildRedirect('/newsletter/confirm-error?reason=sync')
      }
    }

    await this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: NewsletterStatus.CONFIRMED,
        confirmedAt: subscriber.confirmedAt ?? new Date(),
        confirmTokenHash: null,
        confirmTokenExpiresAt: null,
        resendContactId,
      },
    })

    this.logger.log(`Newsletter confirmed: ${subscriber.email}`)

    return this.buildRedirect('/newsletter/confirmed')
  }
}
