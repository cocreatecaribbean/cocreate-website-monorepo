import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
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
  RegisterOrgInboxAttachmentInput,
  SendOrgInboxMessageInput,
} from '@cocreate/api-contracts/v1/requests/org-inbox'
import type { UploadUrlInput } from '@cocreate/api-contracts/v1/requests/projects'
import type {
  OrgInboxAttachment,
  OrgInboxConversation,
  OrgInboxMessage,
} from '@cocreate/api-contracts/v1/shared/org-inbox'
import { ThreadSummaryStoreService } from '../messaging-summary/thread-summary-store.service'
import { ProjectNotificationsService } from '../projects/project-notifications.service'
import { MessagingEmitService } from '../messaging/messaging-emit.service'
import { ProjectStorageService } from '../projects/project-storage.service'

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
  messages?: {
    body: string
    createdAt: Date
    authorUserId: string
    attachmentLinks?: { attachment: { fileName: string } }[]
  }[]
}

@Injectable()
export class OrgInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientAccess: ClientAccessService,
    private readonly notifications: ProjectNotificationsService,
    private readonly messaging: MessagingEmitService,
    private readonly storage: ProjectStorageService,
    private readonly threadSummaryStore: ThreadSummaryStoreService,
  ) {}

  private assertClientCanAccessGetHelp(client: AuthenticatedClient) {
    if (!this.clientAccess.canAccessGetHelp(client)) {
      throw new ForbiddenException('You do not have access to Get Help messaging')
    }
  }

  private clientPortalMessagesHref(conversationId: string) {
    return `/?ccView=messages&conversationId=${encodeURIComponent(conversationId)}`
  }

  private adminMessagesHref(organizationId: string, conversationId: string) {
    return `/messages?organizationId=${encodeURIComponent(organizationId)}&conversationId=${encodeURIComponent(conversationId)}`
  }

  private serializeAttachment(row: {
    id: string
    fileName: string
    mimeType: string
    sizeBytes: number
    createdAt: Date
  }): OrgInboxAttachment {
    return {
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
    }
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
      attachmentLinks?: Array<{ attachment: {
        id: string
        fileName: string
        mimeType: string
        sizeBytes: number
        createdAt: Date
      } }>
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
      attachments:
        row.attachmentLinks?.map((link) => this.serializeAttachment(link.attachment)) ??
        [],
    }
  }

  private messageInclude() {
    return {
      author: { select: { email: true } },
      attachmentLinks: { include: { attachment: true } },
    }
  }

  private messagePreview(body: string, attachmentCount: number) {
    const trimmed = body.trim().slice(0, 120)
    if (trimmed) return trimmed
    return attachmentCount > 0 ? 'Sent an attachment' : null
  }

  private async linkAttachmentsToMessage(
    messageId: string,
    conversationId: string,
    organizationId: string,
    attachmentIds: string[] | undefined,
  ) {
    const ids = [...new Set(attachmentIds ?? [])]
    if (ids.length === 0) return

    const attachments = await this.prisma.orgInboxAttachment.findMany({
      where: {
        id: { in: ids },
        conversationId,
        organizationId,
      },
      select: { id: true },
    })
    if (attachments.length !== ids.length) {
      throw new BadRequestException(
        'One or more attachments are invalid for this conversation',
      )
    }

    await this.prisma.orgInboxMessageAttachment.createMany({
      data: ids.map((attachmentId) => ({ messageId, attachmentId })),
      skipDuplicates: true,
    })
  }

  private async getConversationForActor(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
  ) {
    if (viewer.role === UserRole.CLIENT) {
      return this.assertClientCanViewConversation(
        viewer as AuthenticatedClient,
        conversationId,
      )
    }
    const conversation = await this.prisma.orgInboxConversation.findUnique({
      where: { id: conversationId },
    })
    if (!conversation) throw new NotFoundException('Conversation not found')
    return conversation
  }

  async createUploadUrl(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
    dto: UploadUrlInput,
  ) {
    const conversation = await this.getConversationForActor(viewer, conversationId)
    return this.storage.createInboxUploadUrl({
      organizationId: conversation.organizationId,
      conversationId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async registerAttachment(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
    dto: RegisterOrgInboxAttachmentInput,
  ) {
    const conversation = await this.getConversationForActor(viewer, conversationId)
    this.storage.assertPathBelongsToInboxConversation(
      dto.storagePath,
      conversation.organizationId,
      conversationId,
    )

    const row = await this.prisma.orgInboxAttachment.create({
      data: {
        organizationId: conversation.organizationId,
        conversationId,
        storagePath: dto.storagePath,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploadedByUserId: viewer.id,
      },
    })

    return this.serializeAttachment(row)
  }

  async getAttachmentDownloadUrl(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.orgInboxAttachment.findUnique({
      where: { id: attachmentId },
      include: { conversation: { include: { participants: { select: { userId: true } } } } },
    })
    if (!attachment) throw new NotFoundException('Attachment not found')

    if (viewer.role === UserRole.CLIENT) {
      const client = viewer as AuthenticatedClient
      this.assertClientCanAccessGetHelp(client)
      const organizationId = this.clientAccess.requireOrganizationId(client)
      if (attachment.organizationId !== organizationId) {
        throw new NotFoundException('Attachment not found')
      }
      if (attachment.conversation.visibility === OrgInboxVisibility.RESTRICTED) {
        const isParticipant = attachment.conversation.participants.some(
          (p) => p.userId === client.id,
        )
        if (!isParticipant) throw new ForbiddenException('Access denied')
      }
    }

    const download = await this.storage.createDownloadUrl(attachment.storagePath)
    return { ok: true as const, download }
  }

  async downloadAttachmentBytes(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    attachmentId: string,
  ): Promise<Buffer | null> {
    const attachment = await this.prisma.orgInboxAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        conversation: {
          include: { participants: { select: { userId: true } } },
        },
      },
    })
    if (!attachment) return null

    if (viewer.role === UserRole.CLIENT) {
      const client = viewer as AuthenticatedClient
      const organizationId = this.clientAccess.requireOrganizationId(client)
      if (attachment.organizationId !== organizationId) {
        return null
      }
      if (attachment.conversation.visibility === OrgInboxVisibility.RESTRICTED) {
        const isParticipant = attachment.conversation.participants.some(
          (p) => p.userId === client.id,
        )
        if (!isParticipant) return null
      }
    }

    try {
      return await this.storage.downloadObject(attachment.storagePath)
    } catch {
      return null
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
      lastMessagePreview: lastMessage
        ? this.messagePreview(
            lastMessage.body,
            lastMessage.attachmentLinks?.length ?? 0,
          )
        : null,
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
        select: {
          body: true,
          createdAt: true,
          authorUserId: true,
          attachmentLinks: { select: { attachment: { select: { fileName: true } } } },
        },
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
    this.assertClientCanAccessGetHelp(client)
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
    this.assertClientCanAccessGetHelp(client)
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
      include: this.messageInclude(),
    })

    return {
      ok: true as const,
      messages: messages.map((row) => this.serializeMessage(row)),
    }
  }

  async getConversationForSummary(
    conversationId: string,
    viewer: AuthenticatedClient | AuthenticatedAdmin,
  ) {
    if (viewer.role === UserRole.CLIENT) {
      await this.assertClientCanViewConversation(viewer as AuthenticatedClient, conversationId)
    }

    const conversation = await this.prisma.orgInboxConversation.findUnique({
      where: { id: conversationId },
      include: {
        organization: { select: { name: true } },
        createdBy: { select: { email: true } },
      },
    })
    if (!conversation) throw new NotFoundException('Conversation not found')

    const title =
      conversation.subject?.trim() ||
      (conversation.visibility === OrgInboxVisibility.ORG_WIDE
        ? 'General inquiries'
        : 'Private conversation')
    const subtitle = [
      conversation.organization.name,
      conversation.createdBy?.email
        ? `Started by ${conversation.createdBy.email}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ')

    return { title, subtitle: subtitle || null }
  }

  async createConversationForClient(
    client: AuthenticatedClient,
    dto: CreateOrgInboxConversationInput,
  ) {
    this.assertClientCanAccessGetHelp(client)

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
    this.assertClientCanAccessGetHelp(client)
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const conversation = await this.assertClientCanViewConversation(client, conversationId)

    const body = dto.body.trim()
    const attachmentIds = dto.attachmentIds ?? []
    if (!body && attachmentIds.length === 0) {
      throw new BadRequestException(
        'Message must include text or at least one attachment',
      )
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.orgInboxMessage.create({
        data: {
          conversationId,
          authorUserId: client.id,
          authorRole: OrgInboxAuthorRole.CLIENT,
          body,
        },
        include: this.messageInclude(),
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

    await this.linkAttachmentsToMessage(
      message.id,
      conversationId,
      organizationId,
      attachmentIds,
    )

    const messageWithAttachments =
      attachmentIds.length > 0
        ? await this.prisma.orgInboxMessage.findUniqueOrThrow({
            where: { id: message.id },
            include: this.messageInclude(),
          })
        : message

    const preview =
      body.slice(0, 200) || (attachmentIds.length ? 'Sent an attachment' : '')
    const serialized = this.serializeMessage(messageWithAttachments)
    void this.messaging.emitInboxMessage(conversationId, serialized as Record<string, unknown>)
    void this.threadSummaryStore.invalidate('ORG_INBOX', conversationId)
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

    const body = dto.body.trim()
    const attachmentIds = dto.attachmentIds ?? []
    if (!body && attachmentIds.length === 0) {
      throw new BadRequestException(
        'Message must include text or at least one attachment',
      )
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.orgInboxMessage.create({
        data: {
          conversationId,
          authorUserId: admin.id,
          authorRole: OrgInboxAuthorRole.ADMIN,
          body,
        },
        include: this.messageInclude(),
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

    await this.linkAttachmentsToMessage(
      message.id,
      conversationId,
      conversation.organizationId,
      attachmentIds,
    )

    const messageWithAttachments =
      attachmentIds.length > 0
        ? await this.prisma.orgInboxMessage.findUniqueOrThrow({
            where: { id: message.id },
            include: this.messageInclude(),
          })
        : message

    const preview =
      body.slice(0, 200) || (attachmentIds.length ? 'Sent an attachment' : '')
    const href = this.clientPortalMessagesHref(conversationId)
    const serialized = this.serializeMessage(messageWithAttachments)

    void this.messaging.emitInboxMessage(conversationId, serialized as Record<string, unknown>)
    void this.threadSummaryStore.invalidate('ORG_INBOX', conversationId)

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

  async markReadForClient(client: AuthenticatedClient, conversationId: string) {
    this.assertClientCanAccessGetHelp(client)
    await this.assertClientCanViewConversation(client, conversationId)
    return this.markRead(client.id, conversationId)
  }

  async markRead(userId: string, conversationId: string) {
    await this.prisma.orgInboxReadCursor.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    })
    // PortalNotification rows have no conversation FK — match by href query param.
    await this.prisma.portalNotification.updateMany({
      where: {
        userId,
        readAt: null,
        type: PortalNotificationType.ORG_INBOX_MESSAGE,
        href: { contains: `conversationId=${encodeURIComponent(conversationId)}` },
      },
      data: { readAt: new Date() },
    })
    return { ok: true as const }
  }

  async unreadCountForClient(client: AuthenticatedClient) {
    this.assertClientCanAccessGetHelp(client)
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
    if (conversations.length === 0) return { unreadCount: 0 }

    const conversationIds = conversations.map((c) => c.id)
    const cursors = await this.prisma.orgInboxReadCursor.findMany({
      where: {
        userId: client.id,
        conversationId: { in: conversationIds },
      },
      select: { conversationId: true, lastReadAt: true },
    })
    const cursorByConversation = new Map(
      cursors.map((c) => [c.conversationId, c.lastReadAt]),
    )

    const unreadCount = await this.prisma.orgInboxMessage.count({
      where: {
        OR: conversationIds.map((conversationId) => ({
          conversationId,
          authorUserId: { not: client.id },
          ...(cursorByConversation.has(conversationId)
            ? { createdAt: { gt: cursorByConversation.get(conversationId)! } }
            : {}),
        })),
      },
    })

    return { unreadCount }
  }

  async unreadCountForAdmin(adminId: string) {
    const conversations = await this.prisma.orgInboxConversation.findMany({
      select: { id: true },
    })
    if (conversations.length === 0) return { unreadCount: 0 }

    const conversationIds = conversations.map((c) => c.id)
    const cursors = await this.prisma.orgInboxReadCursor.findMany({
      where: {
        userId: adminId,
        conversationId: { in: conversationIds },
      },
      select: { conversationId: true, lastReadAt: true },
    })
    const cursorByConversation = new Map(
      cursors.map((c) => [c.conversationId, c.lastReadAt]),
    )

    const unreadCount = await this.prisma.orgInboxMessage.count({
      where: {
        OR: conversationIds.map((conversationId) => ({
          conversationId,
          authorRole: OrgInboxAuthorRole.CLIENT,
          ...(cursorByConversation.has(conversationId)
            ? { createdAt: { gt: cursorByConversation.get(conversationId)! } }
            : {}),
        })),
      },
    })

    return { unreadCount }
  }

  async assertInboxAccess(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
  ): Promise<void> {
    if (viewer.role === UserRole.CLIENT) {
      await this.assertClientCanViewConversation(viewer as AuthenticatedClient, conversationId)
      return
    }
    const exists = await this.prisma.orgInboxConversation.findUnique({
      where: { id: conversationId },
    })
    if (!exists) throw new NotFoundException('Conversation not found')
  }

  async postToOrgWideAsMember(client: AuthenticatedClient, body: string) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const conversation = await this.ensureOrgWideConversation(organizationId, client.id)
    return this.sendMessageAsClient(client, conversation.id, { body })
  }
}
