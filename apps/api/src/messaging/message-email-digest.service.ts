import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  MessageEmailDigestAudience,
  MessageEmailDigestChannel,
  ProjectRequestType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import { MessagingPresenceService } from './messaging-presence.service'
import { ProjectNotificationMailService } from '../projects/project-notification-mail.service'

/** Portal activity within this window suppresses chat digests. */
export const MESSAGE_DIGEST_ACTIVE_MS = 30 * 60 * 1000
/** Quiet window after last message before a digest email is sent. */
export const MESSAGE_DIGEST_QUIET_MS = 20 * 60 * 1000

export type DigestEnqueueProjectParams = {
  recipientUserIds: string[]
  audience: MessageEmailDigestAudience
  requestId: string
  requestType: ProjectRequestType
  organizationId: string
  projectId: string
  projectTitle: string
  preview: string
  authorLabel: string
  authorUserId: string
}

export type DigestEnqueueInboxParams = {
  recipientUserIds: string[]
  audience: MessageEmailDigestAudience
  conversationId: string
  organizationId: string
  conversationSubject: string | null
  preview: string
  authorLabel: string
  authorUserId: string
}

@Injectable()
export class MessageEmailDigestService {
  private readonly logger = new Logger(MessageEmailDigestService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: ProjectNotificationMailService,
    private readonly presence: MessagingPresenceService,
  ) {}

  adminCenterUrl() {
    return (
      this.config.get<string>('ADMIN_CENTER_URL')?.trim() ||
      'http://localhost:3002'
    ).replace(/\/$/, '')
  }

  clientPortalUrl() {
    return (
      this.config.get<string>('CLIENT_PORTAL_URL')?.trim() ||
      'http://localhost:3003'
    ).replace(/\/$/, '')
  }

  surfaceLabelForRequestType(type: ProjectRequestType): string {
    switch (type) {
      case ProjectRequestType.PROGRESS:
        return 'Project updates'
      case ProjectRequestType.ONBOARDING:
        return 'Onboarding'
      case ProjectRequestType.INTERNAL:
        return 'Team review'
      case ProjectRequestType.CANCELLATION:
        return 'Cancellation'
      default:
        return 'Project conversation'
    }
  }

  projectTabForRequestType(type: ProjectRequestType): 'progress' | 'onboarding' | null {
    if (type === ProjectRequestType.PROGRESS) return 'progress'
    if (type === ProjectRequestType.ONBOARDING) return 'onboarding'
    return null
  }

  clientProjectDeepLink(projectId: string, type: ProjectRequestType): string {
    const tab = this.projectTabForRequestType(type)
    const base = `${this.clientPortalUrl()}/?ccView=projects&projectId=${encodeURIComponent(projectId)}`
    return tab ? `${base}&projectTab=${tab}` : base
  }

  adminProjectDeepLink(
    organizationId: string,
    projectId: string,
    type: ProjectRequestType,
  ): string {
    const tab = this.projectTabForRequestType(type) ?? 'progress'
    return `${this.adminCenterUrl()}/clients/${encodeURIComponent(organizationId)}/projects/${encodeURIComponent(projectId)}?tab=${tab}`
  }

  clientInboxDeepLink(conversationId: string): string {
    return `${this.clientPortalUrl()}/?ccView=messages&conversationId=${encodeURIComponent(conversationId)}`
  }

  adminInboxDeepLink(organizationId: string, conversationId: string): string {
    return `${this.adminCenterUrl()}/messages?organizationId=${encodeURIComponent(organizationId)}&conversationId=${encodeURIComponent(conversationId)}`
  }

  async touchLastSeen(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    })
  }

  async cancelPendingDigests(params: {
    userId: string
    channel: MessageEmailDigestChannel
    threadKey: string
  }): Promise<void> {
    await this.prisma.messageEmailDigest.updateMany({
      where: {
        recipientUserId: params.userId,
        channel: params.channel,
        threadKey: params.threadKey,
        sentAt: null,
        cancelledAt: null,
      },
      data: { cancelledAt: new Date() },
    })
  }

  private async hasUnreadForDigest(params: {
    userId: string
    channel: MessageEmailDigestChannel
    threadKey: string
  }): Promise<boolean> {
    if (params.channel === MessageEmailDigestChannel.ORG_INBOX) {
      const [cursor, latest] = await Promise.all([
        this.prisma.orgInboxReadCursor.findUnique({
          where: {
            conversationId_userId: {
              conversationId: params.threadKey,
              userId: params.userId,
            },
          },
          select: { lastReadAt: true },
        }),
        this.prisma.orgInboxMessage.findFirst({
          where: { conversationId: params.threadKey },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ])
      if (!latest) return false
      if (cursor && cursor.lastReadAt >= latest.createdAt) return false
      return true
    }

    const unread = await this.prisma.portalNotification.count({
      where: {
        userId: params.userId,
        requestId: params.threadKey,
        readAt: null,
      },
    })
    return unread > 0
  }

  async isRecipientActiveForThread(params: {
    userId: string
    channel: MessageEmailDigestChannel
    threadKey: string
  }): Promise<boolean> {
    const inRoom =
      params.channel === MessageEmailDigestChannel.PROJECT_REQUEST
        ? this.presence.isInThreadRoom(params.userId, params.threadKey)
        : this.presence.isInInboxRoom(params.userId, params.threadKey)
    if (inRoom) return true

    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { lastSeenAt: true },
    })
    if (!user?.lastSeenAt) return false
    return Date.now() - user.lastSeenAt.getTime() < MESSAGE_DIGEST_ACTIVE_MS
  }

  async enqueueProjectDigests(params: DigestEnqueueProjectParams): Promise<void> {
    if (params.requestType === ProjectRequestType.INTERNAL) return

    const surfaceLabel = this.surfaceLabelForRequestType(params.requestType)
    const deepLinkUrl =
      params.audience === MessageEmailDigestAudience.CLIENT
        ? this.clientProjectDeepLink(params.projectId, params.requestType)
        : this.adminProjectDeepLink(
            params.organizationId,
            params.projectId,
            params.requestType,
          )

    await this.enqueueForRecipients({
      recipientUserIds: params.recipientUserIds,
      audience: params.audience,
      channel: MessageEmailDigestChannel.PROJECT_REQUEST,
      threadKey: params.requestId,
      organizationId: params.organizationId,
      projectId: params.projectId,
      projectTitle: params.projectTitle,
      surfaceLabel,
      deepLinkUrl,
      preview: params.preview,
      authorLabel: params.authorLabel,
      authorUserId: params.authorUserId,
    })
  }

  async enqueueInboxDigests(params: DigestEnqueueInboxParams): Promise<void> {
    const surfaceLabel = 'Get Help'
    const deepLinkUrl =
      params.audience === MessageEmailDigestAudience.CLIENT
        ? this.clientInboxDeepLink(params.conversationId)
        : this.adminInboxDeepLink(params.organizationId, params.conversationId)

    await this.enqueueForRecipients({
      recipientUserIds: params.recipientUserIds,
      audience: params.audience,
      channel: MessageEmailDigestChannel.ORG_INBOX,
      threadKey: params.conversationId,
      organizationId: params.organizationId,
      projectId: null,
      projectTitle: params.conversationSubject,
      surfaceLabel,
      deepLinkUrl,
      preview: params.preview,
      authorLabel: params.authorLabel,
      authorUserId: params.authorUserId,
    })
  }

  private async enqueueForRecipients(params: {
    recipientUserIds: string[]
    audience: MessageEmailDigestAudience
    channel: MessageEmailDigestChannel
    threadKey: string
    organizationId: string
    projectId: string | null
    projectTitle: string | null
    surfaceLabel: string
    deepLinkUrl: string
    preview: string
    authorLabel: string
    authorUserId: string
  }): Promise<void> {
    const uniqueIds = [...new Set(params.recipientUserIds)].filter(
      (id) => id !== params.authorUserId,
    )
    if (uniqueIds.length === 0) return

    const scheduledSendAt = new Date(Date.now() + MESSAGE_DIGEST_QUIET_MS)

    for (const recipientUserId of uniqueIds) {
      const active = await this.isRecipientActiveForThread({
        userId: recipientUserId,
        channel: params.channel,
        threadKey: params.threadKey,
      })
      if (active) continue

      const pending = await this.prisma.messageEmailDigest.findFirst({
        where: {
          recipientUserId,
          channel: params.channel,
          threadKey: params.threadKey,
          sentAt: null,
          cancelledAt: null,
        },
      })

      if (pending) {
        await this.prisma.messageEmailDigest.update({
          where: { id: pending.id },
          data: {
            messageCount: { increment: 1 },
            lastPreview: params.preview,
            lastAuthorLabel: params.authorLabel,
            deepLinkUrl: params.deepLinkUrl,
            surfaceLabel: params.surfaceLabel,
            projectTitle: params.projectTitle,
            scheduledSendAt,
          },
        })
      } else {
        await this.prisma.messageEmailDigest.create({
          data: {
            recipientUserId,
            audience: params.audience,
            channel: params.channel,
            threadKey: params.threadKey,
            organizationId: params.organizationId,
            projectId: params.projectId,
            projectTitle: params.projectTitle,
            surfaceLabel: params.surfaceLabel,
            deepLinkUrl: params.deepLinkUrl,
            messageCount: 1,
            lastPreview: params.preview,
            lastAuthorLabel: params.authorLabel,
            scheduledSendAt,
          },
        })
      }
    }
  }

  buildDigestEmail(digest: {
    messageCount: number
    surfaceLabel: string
    projectTitle: string | null
    lastPreview: string
    lastAuthorLabel: string | null
    deepLinkUrl: string
  }) {
    const where =
      digest.projectTitle != null && digest.projectTitle.length > 0
        ? `${digest.surfaceLabel} — ${digest.projectTitle}`
        : digest.surfaceLabel
    const countLabel =
      digest.messageCount === 1
        ? '1 new message'
        : `${digest.messageCount} new messages`
    const subject = `${countLabel} in ${where}`
    const fromLine = digest.lastAuthorLabel
      ? `<p><strong>${digest.lastAuthorLabel}</strong> wrote:</p>`
      : ''
    const html = `<p>You have <strong>${countLabel}</strong> in <strong>${where}</strong>.</p>${fromLine}<blockquote>${digest.lastPreview}</blockquote><p><a href="${digest.deepLinkUrl}">Open conversation</a></p>`
    const text = `You have ${countLabel} in ${where}.\n\n${digest.lastAuthorLabel ? `${digest.lastAuthorLabel}: ` : ''}${digest.lastPreview}\n\nOpen: ${digest.deepLinkUrl}`
    return { subject, html, text, actionLink: digest.deepLinkUrl }
  }

  async processDueDigests(): Promise<number> {
    const now = new Date()
    const due = await this.prisma.messageEmailDigest.findMany({
      where: {
        scheduledSendAt: { lte: now },
        sentAt: null,
        cancelledAt: null,
      },
      take: 100,
      include: {
        recipient: { select: { id: true, email: true, status: true } },
      },
    })

    let sent = 0
    for (const digest of due) {
      if (digest.recipient.status === UserStatus.SUSPENDED) {
        await this.prisma.messageEmailDigest.update({
          where: { id: digest.id },
          data: { cancelledAt: now },
        })
        continue
      }

      const active = await this.isRecipientActiveForThread({
        userId: digest.recipientUserId,
        channel: digest.channel,
        threadKey: digest.threadKey,
      })
      if (active) {
        await this.prisma.messageEmailDigest.update({
          where: { id: digest.id },
          data: { cancelledAt: now },
        })
        continue
      }

      const unread = await this.hasUnreadForDigest({
        userId: digest.recipientUserId,
        channel: digest.channel,
        threadKey: digest.threadKey,
      })
      if (!unread) {
        await this.prisma.messageEmailDigest.update({
          where: { id: digest.id },
          data: { cancelledAt: now },
        })
        continue
      }

      const email = this.buildDigestEmail(digest)
      const result = await this.mail.send({
        to: digest.recipient.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        actionLink: email.actionLink,
      })

      if (result === 'sent' || result === 'dev') {
        await this.prisma.messageEmailDigest.update({
          where: { id: digest.id },
          data: { sentAt: now },
        })
        sent += 1
      } else {
        this.logger.warn(
          `Digest ${digest.id} not sent (${result}); will retry next cron`,
        )
      }
    }

    return sent
  }

  /** Resolve active client membership user ids for an org (not legacy organizationId). */
  async activeClientRecipients(organizationId: string): Promise<string[]> {
    const rows = await this.prisma.clientOrganizationMembership.findMany({
      where: {
        organizationId,
        user: {
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
        status: UserStatus.ACTIVE,
      },
      select: { userId: true },
    })
    return rows.map((r) => r.userId)
  }

  async activeAdminRecipients(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: { id: true },
    })
    return admins.map((a) => a.id)
  }
}
