import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientProjectStatus,
  PortalNotificationType,
  ProjectApprovalItemStatus,
  ProjectMessageAuthorRole,
  ProjectMessageKind,
  ProjectRequestStatus,
  ProjectRequestType,
} from '@cocreate/database'
import type {
  AuthenticatedAgencyUser,
  AuthenticatedClient,
} from '../auth/auth.service'
import { AgencyAccessService } from '../auth/agency-access.service'
import { isCollaboratorRole } from '../auth/admin-roles'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { createClientApprovalRecord } from './client-approval-record.util'
import { ProjectNotificationsService } from './project-notifications.service'
import { MessagingEmitService } from '../messaging/messaging-emit.service'
import { ProjectStorageService } from './project-storage.service'
import {
  serializeApprovalComment,
  serializeApprovalItem,
} from './project-approvals.serializer'
import { serializeMessage, serializeRequest } from './projects.serializer'
import { userActorSelect } from '../users/display-name'
import type {
  AddApprovalCommentInput,
  RequestApprovalNeedsChangesInput,
  SendApprovalFilesInput,
  SubmitApprovalRevisionInput,
} from '@cocreate/api-contracts/v1/requests/projects'

export const CLIENT_OPEN_APPROVAL_STATUSES = [
  ProjectApprovalItemStatus.PENDING,
  ProjectApprovalItemStatus.NEEDS_CHANGES,
] as const

@Injectable()
export class ProjectApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientAccess: ClientAccessService,
    private readonly agencyAccess: AgencyAccessService,
    private readonly storage: ProjectStorageService,
    private readonly notifications: ProjectNotificationsService,
    private readonly messaging: MessagingEmitService,
  ) {}

  private async getProjectById(projectId: string) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: { organization: { select: { id: true, name: true } } },
    })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  private async ensureProgressThread(projectId: string, createdByUserId: string) {
    return this.prisma.projectRequest.upsert({
      where: {
        projectId_type: { projectId, type: ProjectRequestType.PROGRESS },
      },
      create: {
        projectId,
        type: ProjectRequestType.PROGRESS,
        title: 'Progress updates',
        description: 'Ongoing work and deliverables for this project.',
        createdByUserId,
        status: ProjectRequestStatus.OPEN,
      },
      update: {},
    })
  }

  private approvalItemInclude() {
    return {
      attachment: true,
      project: { select: { id: true, title: true, organizationId: true } },
      request: { select: { id: true, title: true } },
    } as const
  }

  private approvalItemIncludeWithComments() {
    return {
      ...this.approvalItemInclude(),
      comments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          author: { select: userActorSelect },
          attachmentLinks: { include: { attachment: true } },
        },
      },
    } as const
  }

  private publishApprovalThreadUpdate(requestId: string) {
    void this.messaging.emitThreadCheckpoint(requestId)
  }

  private requestThreadInclude() {
    return {
      createdBy: { select: userActorSelect },
      resolvedBy: { select: userActorSelect },
      attachments: true,
      messages: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          author: { select: userActorSelect },
          attachmentLinks: { include: { attachment: true } },
        },
      },
      project: { include: { organization: { select: { id: true, name: true } } } },
    } as const
  }

  private notifyApprovalSentInBackground(
    items: Array<{ id: string; attachmentId: string; title: string }>,
    project: { organizationId: string; title: string },
    note: string | null,
    progressRequestId: string,
    projectId: string,
  ) {
    void (async () => {
      for (const item of items) {
        const file = await this.prisma.projectAttachment.findUnique({
          where: { id: item.attachmentId },
          select: { fileName: true },
        })
        const portalLink = `${this.notifications.clientPortalUrl()}/?ccView=approvals&approvalItemId=${item.id}`
        await this.notifications.notifyOrgClients({
          organizationId: project.organizationId,
          type: PortalNotificationType.APPROVAL_FILE_PENDING,
          title: `Approval needed: ${file?.fileName ?? item.title}`,
          body: note ?? `Review ${file?.fileName ?? 'this file'} in your portal.`,
          href: portalLink,
          projectId,
          requestId: progressRequestId,
          email: {
            subject: `Approval needed: ${file?.fileName ?? item.title}`,
            html: `<p>CoCreate sent <strong>${file?.fileName ?? item.title}</strong> for your approval on <strong>${project.title}</strong>.</p><p><a href="${portalLink}">Review in portal</a></p>`,
            text: `Approval needed: ${file?.fileName ?? item.title}\n${portalLink}`,
            actionLink: portalLink,
          },
        })
      }
    })()
  }

  private async getApprovalItemForClient(itemId: string, client: AuthenticatedClient) {
    const item = await this.prisma.projectApprovalItem.findUnique({
      where: { id: itemId },
      include: this.approvalItemInclude(),
    })
    if (!item) throw new NotFoundException('Approval item not found')
    await this.clientAccess.assertProjectAccess(client, item.projectId, 'VIEW')
    return item
  }

  private async getApprovalItemForAdmin(itemId: string, admin: AuthenticatedAgencyUser) {
    const item = await this.prisma.projectApprovalItem.findUnique({
      where: { id: itemId },
      include: this.approvalItemInclude(),
    })
    if (!item) throw new NotFoundException('Approval item not found')
    await this.agencyAccess.assertCanAccessProject(admin, item.projectId)
    return item
  }

  async sendApprovalFiles(
    admin: AuthenticatedAgencyUser,
    projectId: string,
    dto: SendApprovalFilesInput,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can send files for approval')
    }
    const project = await this.getProjectById(projectId)
    if (project.status !== ClientProjectStatus.ACTIVE) {
      throw new BadRequestException('Files can only be sent for approval on active projects')
    }

    const progress = await this.ensureProgressThread(projectId, admin.id)
    const titlePrefix = dto.title.trim()
    const note = dto.note?.trim() || null
    const attachments = dto.attachments ?? []
    const libraryAttachmentIds = [...new Set(dto.attachmentIds ?? [])]

    if (attachments.length === 0 && libraryAttachmentIds.length === 0) {
      throw new BadRequestException('At least one file is required for approval')
    }

    for (const attachment of attachments) {
      this.storage.assertPathBelongsToProject(
        attachment.storagePath,
        project.organizationId,
        project.id,
      )
    }

    const items = await this.prisma.$transaction(async (tx) => {
      const createdItems: Awaited<ReturnType<typeof tx.projectApprovalItem.create>>[] = []
      const linkedAttachmentIds: string[] = []

      for (const attachment of attachments) {
        const file = await tx.projectAttachment.create({
          data: {
            projectId: project.id,
            requestId: progress.id,
            storagePath: attachment.storagePath,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            uploadedByUserId: admin.id,
          },
        })
        linkedAttachmentIds.push(file.id)
        const item = await tx.projectApprovalItem.create({
          data: {
            projectId: project.id,
            requestId: progress.id,
            attachmentId: file.id,
            title: titlePrefix ? `${titlePrefix} — ${file.fileName}` : file.fileName,
            note,
            status: ProjectApprovalItemStatus.PENDING,
            sentByUserId: admin.id,
          },
        })
        createdItems.push(item)
      }

      if (libraryAttachmentIds.length > 0) {
        const libraryFiles = await tx.projectAttachment.findMany({
          where: { id: { in: libraryAttachmentIds }, projectId: project.id },
        })
        if (libraryFiles.length !== libraryAttachmentIds.length) {
          throw new BadRequestException(
            'One or more library attachments are invalid for this project',
          )
        }
        for (const file of libraryFiles) {
          if (!file.requestId) {
            await tx.projectAttachment.update({
              where: { id: file.id },
              data: { requestId: progress.id },
            })
          }
          linkedAttachmentIds.push(file.id)
          const item = await tx.projectApprovalItem.create({
            data: {
              projectId: project.id,
              requestId: progress.id,
              attachmentId: file.id,
              title: titlePrefix ? `${titlePrefix} — ${file.fileName}` : file.fileName,
              note,
              status: ProjectApprovalItemStatus.PENDING,
              sentByUserId: admin.id,
            },
          })
          createdItems.push(item)
        }
      }

      const namesFromDb = await tx.projectAttachment.findMany({
        where: { id: { in: linkedAttachmentIds } },
        select: { fileName: true },
        orderBy: { createdAt: 'asc' },
      })
      const namesList = namesFromDb.map((f) => f.fileName).join(', ')
      const chatBody = note
        ? `Sent for approval: ${namesList}\n\n${note}`
        : `Sent for approval: ${namesList}`

      const sentMessage = await tx.projectRequestMessage.create({
        data: {
          requestId: progress.id,
          authorUserId: admin.id,
          authorRole: ProjectMessageAuthorRole.ADMIN,
          body: chatBody,
          messageKind: ProjectMessageKind.CHAT,
        },
      })

      if (linkedAttachmentIds.length > 0) {
        await tx.projectRequestMessageAttachment.createMany({
          data: linkedAttachmentIds.map((attachmentId) => ({
            messageId: sentMessage.id,
            attachmentId,
          })),
          skipDuplicates: true,
        })
      }

      if (createdItems.length > 0) {
        await tx.projectApprovalItem.updateMany({
          where: { id: { in: createdItems.map((item) => item.id) } },
          data: { sentMessageId: sentMessage.id },
        })
      }

      return createdItems.map((item) => ({ ...item, sentMessageId: sentMessage.id }))
    })

    this.notifyApprovalSentInBackground(
      items,
      project,
      note,
      progress.id,
      projectId,
    )

    const sentMessageId = items[0]?.sentMessageId
    if (!sentMessageId) {
      throw new BadRequestException('Approval message was not created')
    }

    const [messageWithLinks, fullThread, fullItems] = await Promise.all([
      this.prisma.projectRequestMessage.findUnique({
        where: { id: sentMessageId },
        include: {
          author: { select: userActorSelect },
          attachmentLinks: { include: { attachment: true } },
        },
      }),
      this.prisma.projectRequest.findUnique({
        where: { id: progress.id },
        include: this.requestThreadInclude(),
      }),
      this.prisma.projectApprovalItem.findMany({
        where: { id: { in: items.map((i) => i.id) } },
        include: this.approvalItemInclude(),
        orderBy: { sentAt: 'asc' },
      }),
    ])

    if (!messageWithLinks || !fullThread) {
      throw new NotFoundException('Progress thread not found after approval send')
    }

    const serializedMessage = serializeMessage(messageWithLinks, { omitStoragePath: true })
    const serializedThread = serializeRequest(
      { ...fullThread, project: fullThread.project },
      { omitStoragePath: true },
    )

    this.messaging.emitThreadMessage(progress.id, serializedMessage as Record<string, unknown>)
    void this.messaging.emitThreadCheckpoint(progress.id)

    return {
      items: fullItems.map((item) => serializeApprovalItem(item, { omitStoragePath: true })),
      sentMessage: serializedMessage,
      thread: serializedThread,
    }
  }

  async listApprovalItemsForProject(
    admin: AuthenticatedAgencyUser,
    projectId: string,
    status?: ProjectApprovalItemStatus,
    options?: { includeComments?: boolean },
  ) {
    await this.agencyAccess.assertCanAccessProject(admin, projectId)
    const items = await this.prisma.projectApprovalItem.findMany({
      where: {
        projectId,
        ...(status ? { status } : {}),
      },
      include: options?.includeComments
        ? this.approvalItemIncludeWithComments()
        : this.approvalItemInclude(),
      orderBy: { sentAt: 'desc' },
    })
    return {
      items: items.map((item) =>
        serializeApprovalItem(item, {
          omitStoragePath: true,
          includeComments: options?.includeComments,
        }),
      ),
    }
  }

  async listOpenForClient(client: AuthenticatedClient) {
    const items = await this.prisma.projectApprovalItem.findMany({
      where: {
        status: { in: [...CLIENT_OPEN_APPROVAL_STATUSES] },
        project: this.clientAccess.accessibleProjectsWhere(client),
      },
      include: this.approvalItemInclude(),
      orderBy: { sentAt: 'desc' },
    })

    const serialized = items.map((item) => serializeApprovalItem(item, { omitStoragePath: true }))

    return {
      items: serialized,
      files: serialized.map((item) => ({
        id: item.id,
        approvalItemId: item.id,
        attachmentId: item.attachmentId,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        createdAt: item.createdAt,
        requestId: item.requestId,
        messageId: item.sentMessageId ?? '',
        projectId: item.projectId,
        projectTitle: item.projectTitle,
        checkpointTitle: item.title,
        checkpointBody: item.note ?? '',
        status: item.status,
        revisionNumber: item.revisionNumber,
        sentAt: item.sentAt,
      })),
    }
  }

  async approveItem(client: AuthenticatedClient, itemId: string) {
    const item = await this.getApprovalItemForClient(itemId, client)
    if (item.status !== ProjectApprovalItemStatus.PENDING) {
      throw new BadRequestException('This file is not awaiting approval')
    }

    const now = new Date()
    await this.prisma.$transaction(async (tx) => {
      await tx.projectApprovalItem.update({
        where: { id: itemId },
        data: {
          status: ProjectApprovalItemStatus.APPROVED,
          decidedAt: now,
          decidedByUserId: client.id,
        },
      })

      await createClientApprovalRecord(
        tx,
        {
          projectId: item.projectId,
          requestId: item.requestId,
          approvalItemId: itemId,
          title: item.title,
          summary: item.note,
          approvedByUserId: client.id,
          approvedAttachmentId: item.attachmentId,
        },
        [item.attachmentId],
      )
    })

    const updated = await this.prisma.projectApprovalItem.findUnique({
      where: { id: itemId },
      include: this.approvalItemInclude(),
    })

    return { item: serializeApprovalItem(updated!, { omitStoragePath: true }) }
  }

  async requestNeedsChanges(
    client: AuthenticatedClient,
    itemId: string,
    dto: RequestApprovalNeedsChangesInput,
  ) {
    const item = await this.getApprovalItemForClient(itemId, client)
    if (item.status !== ProjectApprovalItemStatus.PENDING) {
      throw new BadRequestException('This file is not awaiting approval')
    }

    const body = dto.body?.trim() || 'Needs changes'
    const now = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.projectApprovalItem.update({
        where: { id: itemId },
        data: {
          status: ProjectApprovalItemStatus.NEEDS_CHANGES,
          decidedAt: now,
          decidedByUserId: client.id,
        },
      })

      await tx.projectApprovalComment.create({
        data: {
          approvalItemId: itemId,
          authorUserId: client.id,
          authorRole: ProjectMessageAuthorRole.CLIENT,
          body,
        },
      })
    })

    const adminLink = `${this.notifications.adminClientWorkspaceLink(item.project.organizationId)}?tab=projects&projectId=${item.projectId}&approvalItemId=${itemId}`
    void (async () => {
      await this.notifications.notifyAdmins({
        organizationId: item.project.organizationId,
        type: PortalNotificationType.APPROVAL_NEEDS_CHANGES,
        title: `Changes requested: ${item.attachment.fileName}`,
        body,
        href: adminLink,
        projectId: item.projectId,
        requestId: item.requestId,
      })
    })()

    const updated = await this.prisma.projectApprovalItem.findUnique({
      where: { id: itemId },
      include: this.approvalItemInclude(),
    })

    this.publishApprovalThreadUpdate(item.requestId)

    return { item: serializeApprovalItem(updated!, { omitStoragePath: true }) }
  }

  async listComments(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    itemId: string,
  ) {
    const isClient = 'organization' in actor && Boolean(actor.organization)
    const item = isClient
      ? await this.getApprovalItemForClient(itemId, actor as AuthenticatedClient)
      : await this.getApprovalItemForAdmin(itemId, actor as AuthenticatedAgencyUser)

    const comments = await this.prisma.projectApprovalComment.findMany({
      where: { approvalItemId: item.id },
      include: {
        author: { select: userActorSelect },
        attachmentLinks: { include: { attachment: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return {
      comments: comments.map((comment) => serializeApprovalComment(comment)),
    }
  }

  async addComment(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    itemId: string,
    dto: AddApprovalCommentInput,
  ) {
    const isClient = 'organization' in actor && Boolean(actor.organization)
    const item = isClient
      ? await this.getApprovalItemForClient(itemId, actor as AuthenticatedClient)
      : await this.getApprovalItemForAdmin(itemId, actor as AuthenticatedAgencyUser)

    if (
      item.status !== ProjectApprovalItemStatus.NEEDS_CHANGES &&
      item.status !== ProjectApprovalItemStatus.PENDING
    ) {
      throw new BadRequestException('Comments are only allowed on open approval items')
    }

    const body = dto.body.trim()
    if (!body) throw new BadRequestException('Comment body is required')

    const authorRole = isClient
      ? ProjectMessageAuthorRole.CLIENT
      : isCollaboratorRole(actor.role)
        ? ProjectMessageAuthorRole.COLLABORATOR
        : ProjectMessageAuthorRole.ADMIN

    const comment = await this.prisma.projectApprovalComment.create({
      data: {
        approvalItemId: itemId,
        authorUserId: actor.id,
        authorRole,
        body,
      },
      include: {
        author: { select: userActorSelect },
        attachmentLinks: { include: { attachment: true } },
      },
    })

    if (isClient) {
      const adminLink = `${this.notifications.adminClientWorkspaceLink(item.project.organizationId)}?tab=projects&projectId=${item.projectId}&approvalItemId=${itemId}`
      void (async () => {
        await this.notifications.notifyAdmins({
          organizationId: item.project.organizationId,
          type: PortalNotificationType.APPROVAL_NEEDS_CHANGES,
          title: `New feedback on ${item.attachment.fileName}`,
          body,
          href: adminLink,
          projectId: item.projectId,
          requestId: item.requestId,
        })
      })()
    } else {
      const portalLink = `${this.notifications.clientPortalUrl()}/?ccView=approvals&approvalItemId=${itemId}`
      void (async () => {
        await this.notifications.notifyOrgClients({
          organizationId: item.project.organizationId,
          type: PortalNotificationType.APPROVAL_REVISION_SENT,
          title: `Reply on ${item.attachment.fileName}`,
          body,
          href: portalLink,
          projectId: item.projectId,
          requestId: item.requestId,
        })
      })()
    }

    this.publishApprovalThreadUpdate(item.requestId)

    return { comment: serializeApprovalComment(comment) }
  }

  async submitRevision(
    admin: AuthenticatedAgencyUser,
    itemId: string,
    dto: SubmitApprovalRevisionInput,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can upload revisions')
    }

    const item = await this.getApprovalItemForAdmin(itemId, admin)
    if (item.status !== ProjectApprovalItemStatus.NEEDS_CHANGES) {
      throw new BadRequestException('Revisions can only be uploaded when changes were requested')
    }

    this.storage.assertPathBelongsToProject(
      dto.attachment.storagePath,
      item.project.organizationId,
      item.projectId,
    )

    const updated = await this.prisma.$transaction(async (tx) => {
      const file = await tx.projectAttachment.create({
        data: {
          projectId: item.projectId,
          requestId: item.requestId,
          storagePath: dto.attachment.storagePath,
          fileName: dto.attachment.fileName,
          mimeType: dto.attachment.mimeType,
          sizeBytes: dto.attachment.sizeBytes,
          uploadedByUserId: admin.id,
        },
      })

      const note = dto.note?.trim() || null
      const nextRevision = item.revisionNumber + 1

      const updatedItem = await tx.projectApprovalItem.update({
        where: { id: itemId },
        data: {
          attachmentId: file.id,
          revisionNumber: nextRevision,
          status: ProjectApprovalItemStatus.PENDING,
          decidedAt: null,
          decidedByUserId: null,
          ...(note ? { note } : {}),
        },
        include: this.approvalItemInclude(),
      })

      const revisionComment = await tx.projectApprovalComment.create({
        data: {
          approvalItemId: itemId,
          authorUserId: admin.id,
          authorRole: ProjectMessageAuthorRole.ADMIN,
          body: `Uploaded revision ${nextRevision}: ${file.fileName}${note ? `\n\n${note}` : ''}`,
        },
        include: {
          author: { select: userActorSelect },
          attachmentLinks: { include: { attachment: true } },
        },
      })

      return { updatedItem, revisionComment }
    })

    const { updatedItem, revisionComment } = updated
    const portalLink = `${this.notifications.clientPortalUrl()}/?ccView=approvals&approvalItemId=${itemId}`
    void (async () => {
      await this.notifications.notifyOrgClients({
        organizationId: item.project.organizationId,
        type: PortalNotificationType.APPROVAL_REVISION_SENT,
        title: `Revised file ready: ${updatedItem.attachment.fileName}`,
        body:
          dto.note?.trim() ||
          `Revision ${updatedItem.revisionNumber} is ready for your review.`,
        href: portalLink,
        projectId: item.projectId,
        requestId: item.requestId,
      })
    })()

    this.publishApprovalThreadUpdate(item.requestId)

    return {
      item: serializeApprovalItem(updatedItem, { omitStoragePath: true }),
      comment: serializeApprovalComment(revisionComment),
    }
  }

  async countPendingForProjects(accessibleProjects: import('@cocreate/database').Prisma.ClientProjectWhereInput) {
    return this.prisma.projectApprovalItem.count({
      where: {
        status: ProjectApprovalItemStatus.PENDING,
        project: accessibleProjects,
      },
    })
  }
}
