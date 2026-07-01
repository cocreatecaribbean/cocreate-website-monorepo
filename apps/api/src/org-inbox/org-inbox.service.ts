import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientOrgRole,
  OrgInboxAuthorRole,
  OrgInboxVisibility,
  PortalNotificationType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import type { AuthenticatedAdmin, AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import type {
  CreateOrgInboxConversationInput,
  SendOrgInboxMessageInput,
} from '@cocreate/api-contracts/v1/requests/org-inbox'
import type {
  OrgInboxConversation,
  OrgInboxMessage,
} from '@cocreate/api-contracts/v1/shared/org-inbox'
import { ProjectNotificationsService } from '../projects/project-notifications.service'
import { ProjectRealtimeService } from '../projects/project-realtime.service'

type ConversationRow = {
  id: string
  organizationId: string
  visibility: OrgInboxVisibility
  subject: string | null
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
  organization?: { name: string }
  createdBy?: { email: string }
  messages?: { body: string; createdAt: Date; authorUserId: string }[]
}

@Injectable()
export class OrgInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientAccess: ClientAccessService,
    private readonly notifications: ProjectNotificationsService,
    private readonly realtime: ProjectRealtimeService,
  ) {}

  private clientPortalMessagesHref(conversationId: string) {
    return `/?ccView=messages&conversationId=${encodeURIComponent(conversationId)}`
  }

  private adminMessagesHref(organizationId: string, conversationId: string) {
    return `/messages?organizationId=${encodeURIComponent(organizationId)}&conversationId=${encodeURIComponent(conversationId)}`
  }

  private serializeMessage(
    row: {
      id: string
      conversationId: string
      authorUserId: string
      authorRole: OrgInboxAuthorRole
      body: string
      createdAt: Date
      author: { email: string }
    },
  ): OrgInboxMessage {
    return {
      id: row.id,
      conversationId: row.conversationId,
      authorUserId: row.authorUserId,
      authorEmail: row.author.email,
      authorRole: row.authorRole,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    }
  }

  private async serializeConversation(
    row: ConversationRow,
    viewerUserId: string,
  ): Promise<OrgInboxConversation> {
    const lastMessage = row.messages?.[0]
    const cursor = await this.prisma.orgInboxReadCursor.findUnique({
      where: {
        conversationId_userId: {
          conversationId: row.id,
          userId: viewerUserId,
        },
      },
    })
    const unreadCount = await this.prisma.orgInboxMessage.count({
      where: {
        conversationId: row.id,
        authorUserId: { not: viewerUserId },
        ...(cursor
          ? { createdAt: { gt: cursor.lastReadAt } }
          : {}),
      },
    })

    return {
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization?.name,
      visibility: row.visibility,
      subject: row.subject,
      createdByUserId: row.createdByUserId,
      createdByEmail: row.createdBy?.email,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lastMessagePreview: lastMessage?.body.slice(0, 120) ?? null,
      unreadCount,
    }
  }

  private conversationInclude() {
    return {
      organization: { select: { name: true } },
      createdBy: { select: { email: true } },
      messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { body: true, createdAt: true, authorUserId: true },
      },
    }
  }

  async ensureOrgWideConversation(organizationId: string, createdByUserId: string) {
    const existing = await this.prisma.orgInboxConversation.findFirst({
      where: { organizationId, visibility: OrgInboxVisibility.ORG_WIDE },
    })
    if (existing) return existing

    return this.prisma.orgInboxConversation.create({
      data: {
        organizationId,
        createdByUserId,
        visibility: OrgInboxVisibility.ORG_WIDE,
        subject: 'General inquiries',
      },
    })
  }

  private async assertClientCanViewConversation(
    client: AuthenticatedClient,
    conversationId: string,
  ) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const conversation = await this.prisma.orgInboxConversation.findFirst({
      where: { id: conversationId, organizationId },
      include: { participants: { select: { userId: true } } },
    })
    if (!conversation) throw new NotFoundException('Conversation not found')

    if (conversation.visibility === OrgInboxVisibility.ORG_WIDE) {
      return conversation
    }

    const isParticipant = conversation.participants.some((p) => p.userId === client.id)
    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this conversation')
    }
    return conversation
  }

  async listConversationsForClient(client: AuthenticatedClient) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    await this.ensureOrgWideConversation(organizationId, client.id)

    const conversations = await this.prisma.orgInboxConversation.findMany({
      where: {
        organizationId,
        OR: [
          { visibility: OrgInboxVisibility.ORG_WIDE },
          { participants: { some: { userId: client.id } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: this.conversationInclude(),
    })

    const serialized = await Promise.all(
      conversations.map((row) => this.serializeConversation(row, client.id)),
    )

    return { ok: true as const, conversations: serialized }
  }

  async listConversationsForAdmin(organizationId: string, admin: AuthenticatedAdmin) {
    if (!admin) throw new ForbiddenException()
    await this.ensureOrgWideConversation(organizationId, admin.id)
    const conversations = await this.prisma.orgInboxConversation.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: this.conversationInclude(),
    })

    const serialized = await Promise.all(
      conversations.map((row) => this.serializeConversation(row, admin.id)),
    )

    return { ok: true as const, conversations: serialized }
  }

  async listAllConversationsForAdmin(admin: AuthenticatedAdmin) {
    const conversations = await this.prisma.orgInboxConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: this.conversationInclude(),
    })

    const serialized = await Promise.all(
      conversations.map((row) => this.serializeConversation(row, admin.id)),
    )

    return { ok: true as const, conversations: serialized }
  }

  async listMessages(
    conversationId: string,
    viewer: AuthenticatedClient | AuthenticatedAdmin,
  ) {
    if (viewer.role === UserRole.CLIENT) {
      await this.assertClientCanViewConversation(viewer as AuthenticatedClient, conversationId)
    } else {
      const conversation = await this.prisma.orgInboxConversation.findUnique({
        where: { id: conversationId },
      })
      if (!conversation) throw new NotFoundException('Conversation not found')
    }

    const messages = await this.prisma.orgInboxMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { email: true } } },
    })

    return {
      ok: true as const,
      messages: messages.map((row) => this.serializeMessage(row)),
    }
  }

  async createConversationForClient(
    client: AuthenticatedClient,
    dto: CreateOrgInboxConversationInput,
  ) {
    if (!this.clientAccess.canManageOrgTeam(client)) {
      throw new ForbiddenException('Only org admins can start private conversations')
    }

    const organizationId = this.clientAccess.requireOrganizationId(client)
    const visibility = dto.visibility ?? OrgInboxVisibility.RESTRICTED

    if (visibility === OrgInboxVisibility.ORG_WIDE) {
      const conversation = await this.ensureOrgWideConversation(organizationId, client.id)
      const full = await this.prisma.orgInboxConversation.findUniqueOrThrow({
        where: { id: conversation.id },
        include: this.conversationInclude(),
      })
      return {
        ok: true as const,
        conversation: await this.serializeConversation(full, client.id),
      }
    }

    const participantUserIds = [...new Set([client.id, ...(dto.participantUserIds ?? [])])]
    const conversation = await this.prisma.orgInboxConversation.create({
      data: {
        organizationId,
        createdByUserId: client.id,
        visibility: OrgInboxVisibility.RESTRICTED,
        subject: dto.subject?.trim() || 'Private conversation',
        participants: {
          create: participantUserIds.map((userId) => ({ userId })),
        },
      },
      include: this.conversationInclude(),
    })

    return {
      ok: true as const,
      conversation: await this.serializeConversation(conversation, client.id),
    }
  }

  async sendMessageAsClient(client: AuthenticatedClient, conversationId: string, dto: SendOrgInboxMessageInput) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    let conversation = await this.assertClientCanViewConversation(client, conversationId)

    if (
      conversation.visibility === OrgInboxVisibility.ORG_WIDE &&
      !this.clientAccess.canManageOrgTeam(client) &&
      client.clientOrgRole === ClientOrgRole.MEMBER
    ) {
      // Members post to org-wide only — already viewing org-wide or restricted they're in
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.orgInboxMessage.create({
        data: {
          conversationId,
          authorUserId: client.id,
          authorRole: OrgInboxAuthorRole.CLIENT,
          body: dto.body.trim(),
        },
        include: { author: { select: { email: true } } },
      })
      await tx.orgInboxConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
      await tx.orgInboxReadCursor.upsert({
        where: {
          conversationId_userId: { conversationId, userId: client.id },
        },
        create: { conversationId, userId: client.id, lastReadAt: new Date() },
        update: { lastReadAt: new Date() },
      })
      return created
    })

    const preview = dto.body.trim().slice(0, 200)
    const serialized = this.serializeMessage(message)
    void this.realtime.publishOrgInboxUpdate(conversationId, { message: serialized })
    void this.notifications.notifyAdmins({
      organizationId,
      type: PortalNotificationType.ORG_INBOX_MESSAGE,
      title: conversation.subject ?? 'New client message',
      body: preview,
      href: this.adminMessagesHref(organizationId, conversationId),
    })

    return { ok: true as const, message: serialized }
  }

  async sendMessageAsAdmin(admin: AuthenticatedAdmin, conversationId: string, dto: SendOrgInboxMessageInput) {
    const conversation = await this.prisma.orgInboxConversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { userId: true } } },
    })
    if (!conversation) throw new NotFoundException('Conversation not found')

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.orgInboxMessage.create({
        data: {
          conversationId,
          authorUserId: admin.id,
          authorRole: OrgInboxAuthorRole.ADMIN,
          body: dto.body.trim(),
        },
        include: { author: { select: { email: true } } },
      })
      await tx.orgInboxConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
      await tx.orgInboxReadCursor.upsert({
        where: {
          conversationId_userId: { conversationId, userId: admin.id },
        },
        create: { conversationId, userId: admin.id, lastReadAt: new Date() },
        update: { lastReadAt: new Date() },
      })
      return created
    })

    const preview = dto.body.trim().slice(0, 200)
    const href = this.clientPortalMessagesHref(conversationId)
    const serialized = this.serializeMessage(message)

    void this.realtime.publishOrgInboxUpdate(conversationId, { message: serialized })

    if (conversation.visibility === OrgInboxVisibility.ORG_WIDE) {
      void this.notifications.notifyOrgClients({
        organizationId: conversation.organizationId,
        type: PortalNotificationType.ORG_INBOX_MESSAGE,
        title: 'Reply from CoCreate',
        body: preview,
        href,
      })
    } else {
      const userIds = conversation.participants.map((p) => p.userId)
      void this.notifications.notifyClientUsers({
        organizationId: conversation.organizationId,
        userIds,
        type: PortalNotificationType.ORG_INBOX_MESSAGE,
        title: 'Reply from CoCreate',
        body: preview,
        href,
      })
    }

    return { ok: true as const, message: serialized }
  }

  async markRead(userId: string, conversationId: string) {
    await this.prisma.orgInboxReadCursor.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    })
    return { ok: true as const }
  }

  async unreadCountForClient(client: AuthenticatedClient) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const conversations = await this.prisma.orgInboxConversation.findMany({
      where: {
        organizationId,
        OR: [
          { visibility: OrgInboxVisibility.ORG_WIDE },
          { participants: { some: { userId: client.id } } },
        ],
      },
      select: { id: true },
    })

    let unreadCount = 0
    for (const conversation of conversations) {
      const cursor = await this.prisma.orgInboxReadCursor.findUnique({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: client.id,
          },
        },
      })
      unreadCount += await this.prisma.orgInboxMessage.count({
        where: {
          conversationId: conversation.id,
          authorUserId: { not: client.id },
          ...(cursor ? { createdAt: { gt: cursor.lastReadAt } } : {}),
        },
      })
    }

    return { unreadCount }
  }

  async unreadCountForAdmin(adminId: string) {
    const conversations = await this.prisma.orgInboxConversation.findMany({
      select: { id: true },
    })

    let unreadCount = 0
    for (const conversation of conversations) {
      const cursor = await this.prisma.orgInboxReadCursor.findUnique({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: adminId,
          },
        },
      })
      unreadCount += await this.prisma.orgInboxMessage.count({
        where: {
          conversationId: conversation.id,
          authorRole: OrgInboxAuthorRole.CLIENT,
          ...(cursor ? { createdAt: { gt: cursor.lastReadAt } } : {}),
        },
      })
    }

    return { unreadCount }
  }

  async authorizeRealtime(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
  ) {
    if (viewer.role === UserRole.CLIENT) {
      await this.assertClientCanViewConversation(viewer as AuthenticatedClient, conversationId)
    } else {
      const exists = await this.prisma.orgInboxConversation.findUnique({
        where: { id: conversationId },
      })
      if (!exists) throw new NotFoundException('Conversation not found')
    }

    return {
      enabled: this.realtime.isConfigured,
      channel: this.realtime.orgInboxChannelName(conversationId),
    }
  }

  async postToOrgWideAsMember(client: AuthenticatedClient, body: string) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const conversation = await this.ensureOrgWideConversation(organizationId, client.id)
    return this.sendMessageAsClient(client, conversation.id, { body })
  }
}
