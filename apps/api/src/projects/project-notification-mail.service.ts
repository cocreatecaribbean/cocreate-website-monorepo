import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

export type ProjectEmailEvent =
  | 'project_submitted'
  | 'project_approved'
  | 'change_request'
  | 'admin_review'
  | 'phase_approval'
  | 'request_resolved'

@Injectable()
export class ProjectNotificationMailService implements OnModuleInit {
  private readonly logger = new Logger(ProjectNotificationMailService.name)
  private client: Resend | null = null

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const key = this.config.get<string>('RESEND_API_KEY')?.trim()
    if (key) {
      this.client = new Resend(key)
    }
  }

  private getFromAddress(): string | null {
    const email =
      this.config.get<string>('AUTH_EMAIL_FROM')?.trim() ||
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim()
    if (!email) return null
    const name =
      this.config.get<string>('AUTH_EMAIL_FROM_NAME')?.trim() ||
      'CoCreate Caribbean'
    return `${name} <${email}>`
  }

  useDevLinks(): boolean {
    return this.config.get<string>('AUTH_DEV_LINKS') !== 'false'
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.getFromAddress())
  }

  async send(params: {
    to: string | string[]
    subject: string
    html: string
    text: string
    actionLink?: string
  }): Promise<'sent' | 'dev' | 'skipped'> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to]
    if (recipients.length === 0) return 'skipped'

    if (this.useDevLinks() && params.actionLink) {
      this.logger.log(
        `[project-email] ${params.subject} → ${recipients.join(', ')} — ${params.actionLink}`,
      )
      return 'dev'
    }

    if (!this.isConfigured()) {
      this.logger.warn(`[project-email] skipped (Resend not configured): ${params.subject}`)
      return 'skipped'
    }

    const from = this.getFromAddress()!
    const { error } = await this.client!.emails.send({
      from,
      to: recipients,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (error) {
      this.logger.error(`Project email failed: ${error.message}`)
      return 'skipped'
    }

    return 'sent'
  }

  buildProjectSubmittedEmail(params: {
    orgName: string
    projectTitle: string
    adminLink: string
  }) {
    const subject = `New project submitted: ${params.projectTitle}`
    const body = `${params.orgName} submitted a new project "${params.projectTitle}" for agency review.`
    return {
      subject,
      html: `<p>${body}</p><p><a href="${params.adminLink}">Review in Admin Center</a></p>`,
      text: `${body}\n\nReview: ${params.adminLink}`,
      actionLink: params.adminLink,
    }
  }

  buildProjectApprovedEmail(params: {
    projectTitle: string
    portalLink: string
  }) {
    const subject = `Your project is active: ${params.projectTitle}`
    const body = `CoCreate has approved "${params.projectTitle}". You can track progress in your client portal.`
    return {
      subject,
      html: `<p>${body}</p><p><a href="${params.portalLink}">Open Control Center</a></p>`,
      text: `${body}\n\nPortal: ${params.portalLink}`,
      actionLink: params.portalLink,
    }
  }

  buildChangeRequestEmail(params: {
    orgName: string
    projectTitle: string
    requestTitle: string
    adminLink: string
  }) {
    const subject = `Change request: ${params.requestTitle}`
    const body = `${params.orgName} submitted a change request on "${params.projectTitle}": ${params.requestTitle}`
    return {
      subject,
      html: `<p>${body}</p><p><a href="${params.adminLink}">View inbox</a></p>`,
      text: `${body}\n\nInbox: ${params.adminLink}`,
      actionLink: params.adminLink,
    }
  }

  buildAdminReviewEmail(params: {
    projectTitle: string
    requestTitle: string
    portalLink: string
  }) {
    const subject = `Action needed: ${params.requestTitle}`
    const body = `CoCreate requested your review on "${params.projectTitle}": ${params.requestTitle}`
    return {
      subject,
      html: `<p>${body}</p><p><a href="${params.portalLink}">Review in portal</a></p>`,
      text: `${body}\n\nPortal: ${params.portalLink}`,
      actionLink: params.portalLink,
    }
  }

  buildPhaseApprovalEmail(params: {
    orgName: string
    projectTitle: string
    targetPhase: string
    adminLink: string
  }) {
    const subject = `Phase approval: ${params.projectTitle}`
    const body = `${params.orgName} marked "${params.projectTitle}" ready for ${params.targetPhase}.`
    return {
      subject,
      html: `<p>${body}</p><p><a href="${params.adminLink}">View in Admin Center</a></p>`,
      text: `${body}\n\nAdmin: ${params.adminLink}`,
      actionLink: params.adminLink,
    }
  }

  buildRequestResolvedEmail(params: {
    projectTitle: string
    requestTitle: string
    portalLink: string
  }) {
    const subject = `Update on: ${params.requestTitle}`
    const body = `Your request on "${params.projectTitle}" was updated. Check the portal for details.`
    return {
      subject,
      html: `<p>${body}</p><p><a href="${params.portalLink}">Open project</a></p>`,
      text: `${body}\n\nPortal: ${params.portalLink}`,
      actionLink: params.portalLink,
    }
  }
}
