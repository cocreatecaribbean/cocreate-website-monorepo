import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  PortalNotificationType,
  ProjectAttachmentVisibility,
  ProjectFileReactionKind,
  ProjectMessageAuthorRole,
  ProjectMessageKind,
  ProjectRequestType,
} from '@cocreate/database'
import type {
  FileReactionsResponse,
  ProjectAttachmentWithReactions,
  ProjectFileReactionTag,
  TopPicksResponse,
} from '@cocreate/api-contracts/v1/shared/projects'
import type {
  AuthenticatedAgencyUser,
  AuthenticatedClient,
} from '../auth/auth.service'
import { AgencyAccessService } from '../auth/agency-access.service'
import { ClientAccessService } from '../auth/client-access.service'
import { MessagingEmitService } from '../messaging/messaging-emit.service'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { serializeMessage } from './projects.serializer'
import { resolveActorDisplayName } from '../users/display-name'

const REACTION_META: Record<
  ProjectFileReactionKind,
  { label: string; isPositive: boolean }
> = {
  LOVE_THIS: { label: 'Love this', isPositive: true },
  SHIP_IT: { label: 'Good to go', isPositive: true },
  GREAT_DIRECTION: { label: 'Great direction', isPositive: true },
  ANOTHER_VERSION: { label: 'Another version', isPositive: false },
  NEEDS_A_TWEAK: { label: 'Needs a tweak', isPositive: false },
}

export const POSITIVE_REACTION_KINDS: ProjectFileReactionKind[] = [
  ProjectFileReactionKind.LOVE_THIS,
  ProjectFileReactionKind.SHIP_IT,
  ProjectFileReactionKind.GREAT_DIRECTION,
]

const CHANGES_REQUESTED_KINDS: ProjectFileReactionKind[] = [
  ProjectFileReactionKind.ANOTHER_VERSION,
  ProjectFileReactionKind.NEEDS_A_TWEAK,
]

function parseKind(raw: string): ProjectFileReactionKind {
  const upper = raw.trim().toUpperCase()
  if (!(Object.values(ProjectFileReactionKind) as string[]).includes(upper)) {
    throw new BadRequestException('Invalid reaction')
  }
  return upper as ProjectFileReactionKind
}

type Actor = AuthenticatedClient | AuthenticatedAgencyUser

const userActorSelect = {
  id: true,
  email: true,
  profile: {
    select: {
      displayName: true,
      jobTitle: true,
      avatarStoragePath: true,
    },
  },
} as const

@Injectable()
export class ProjectFileReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientAccess: ClientAccessService,
    private readonly agencyAccess: AgencyAccessService,
    private readonly messaging: MessagingEmitService,
    private readonly notifications: ProjectNotificationsService,
  ) {}

  /**
   * Notify every thread the attachment appears in. Chat uploads are registered
   * with a null requestId and linked to the thread via messageLinks afterwards.
   */
  private notifyThreadAttachment(attachment: {
    requestId: string | null
    messageLinks: { message: { requestId: string } }[]
  }) {
    const requestIds = new Set<string>()
    if (attachment.requestId) requestIds.add(attachment.requestId)
    for (const link of attachment.messageLinks) {
      requestIds.add(link.message.requestId)
    }
    for (const requestId of requestIds) {
      this.messaging.emitThreadAttachment(requestId)
    }
  }

  private isClient(actor: Actor): actor is AuthenticatedClient {
    return actor.role === 'CLIENT'
  }

  private aggregateTags(
    kinds: ProjectFileReactionKind[],
  ): ProjectFileReactionTag[] {
    const counts = new Map<ProjectFileReactionKind, number>()
    for (const kind of kinds) {
      counts.set(kind, (counts.get(kind) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([kind, count]) => ({
        kind,
        label: REACTION_META[kind].label,
        count,
        isPositive: REACTION_META[kind].isPositive,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }

  private serializeAttachment(
    attachment: {
      id: string
      projectId: string
      requestId: string | null
      fileName: string
      mimeType: string
      sizeBytes: number
      createdAt: Date
      reviewRequested?: boolean
      approvedAt?: Date | null
      approvedByUserId?: string | null
      changesRequestedAt?: Date | null
      reactions: { userId: string; kind: ProjectFileReactionKind }[]
    },
    viewerUserId: string,
  ): ProjectAttachmentWithReactions {
    const tags = this.aggregateTags(attachment.reactions.map((r) => r.kind))
    const my = attachment.reactions.find((r) => r.userId === viewerUserId)
    const isTopPick = attachment.reactions.some((r) =>
      POSITIVE_REACTION_KINDS.includes(r.kind),
    )
    return {
      id: attachment.id,
      projectId: attachment.projectId,
      requestId: attachment.requestId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString(),
      reviewRequested: attachment.reviewRequested ?? false,
      approvedAt: attachment.approvedAt?.toISOString() ?? null,
      approvedByUserId: attachment.approvedByUserId ?? null,
      changesRequestedAt: attachment.changesRequestedAt?.toISOString() ?? null,
      myReaction: my?.kind ?? null,
      tags,
      isTopPick,
    }
  }

  private async assertAccess(
    actor: Actor,
    projectId: string,
    visibility: ProjectAttachmentVisibility,
    capability: 'read' | 'write' = 'read',
  ) {
    if (this.isClient(actor)) {
      if (visibility === ProjectAttachmentVisibility.INTERNAL) {
        throw new NotFoundException('File not found')
      }
      if (capability === 'write' && !this.clientAccess.canReactToFiles(actor)) {
        throw new ForbiddenException('You cannot react to files')
      }
      await this.clientAccess.assertProjectAccess(actor, projectId, capability)
      return
    }
    await this.agencyAccess.assertCanAccessProject(actor, projectId)
  }

  private async applyApprovalSideEffects(
    actor: Actor,
    attachmentId: string,
    kind: ProjectFileReactionKind | null,
  ) {
    if (!this.isClient(actor)) return

    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        projectId: true,
        fileName: true,
        visibility: true,
        requestId: true,
        reviewRequested: true,
        approvedAt: true,
        approvedByUserId: true,
        changesRequestedAt: true,
        project: {
          select: {
            id: true,
            title: true,
            organizationId: true,
          },
        },
        messageLinks: {
          select: {
            message: {
              select: {
                requestId: true,
                request: { select: { id: true, type: true } },
              },
            },
          },
        },
      },
    })
    if (!attachment) return
    if (attachment.visibility === ProjectAttachmentVisibility.INTERNAL) return

    const user = await this.prisma.user.findUnique({
      where: { id: actor.id },
      select: userActorSelect,
    })
    const displayName = resolveActorDisplayName(
      user,
      actor.email.split('@')[0] ?? 'Client',
    )

    if (kind === ProjectFileReactionKind.SHIP_IT) {
      const alreadyApprovedBySame =
        attachment.approvedAt != null &&
        attachment.approvedByUserId === actor.id

      await this.prisma.projectAttachment.update({
        where: { id: attachmentId },
        data: {
          approvedAt: new Date(),
          approvedByUserId: actor.id,
          changesRequestedAt: null,
        },
      })

      await this.prisma.projectActivity.create({
        data: {
          projectId: attachment.projectId,
          action: 'file.approved',
          actorUserId: actor.id,
          metadata: {
            attachmentId,
            fileName: attachment.fileName,
          },
        },
      })

      if (!alreadyApprovedBySame) {
        await this.postSystemLineAndNotify({
          attachment,
          actor,
          displayName,
          body: `${displayName} marked ${attachment.fileName} as good to go`,
          notificationType: PortalNotificationType.FILE_APPROVED,
          notificationTitle: `File approved: ${attachment.project.title}`,
          activityAlreadyLogged: true,
        })
      }
      return
    }

    if (kind && CHANGES_REQUESTED_KINDS.includes(kind)) {
      await this.prisma.projectAttachment.update({
        where: { id: attachmentId },
        data: {
          changesRequestedAt: new Date(),
          approvedAt: null,
          approvedByUserId: null,
          reviewRequested: false,
        },
      })

      await this.prisma.projectActivity.create({
        data: {
          projectId: attachment.projectId,
          action: 'file.changes_requested',
          actorUserId: actor.id,
          metadata: {
            attachmentId,
            fileName: attachment.fileName,
            kind,
          },
        },
      })

      await this.postSystemLineAndNotify({
        attachment,
        actor,
        displayName,
        body: `${displayName} requested changes on ${attachment.fileName}`,
        notificationType: PortalNotificationType.FILE_CHANGES_REQUESTED,
        notificationTitle: `Changes requested: ${attachment.project.title}`,
        activityAlreadyLogged: true,
      })
      return
    }

    // Soft praise or cleared reaction — drop formal approval / changes state
    if (attachment.approvedAt || attachment.changesRequestedAt) {
      await this.prisma.projectAttachment.update({
        where: { id: attachmentId },
        data: {
          approvedAt: null,
          approvedByUserId: null,
          changesRequestedAt: null,
        },
      })
    }
  }

  private async postSystemLineAndNotify(params: {
    attachment: {
      id: string
      projectId: string
      fileName: string
      requestId: string | null
      project: { id: string; title: string; organizationId: string }
      messageLinks: Array<{
        message: {
          requestId: string
          request: { id: string; type: ProjectRequestType }
        }
      }>
    }
    actor: AuthenticatedClient
    displayName: string
    body: string
    notificationType: PortalNotificationType
    notificationTitle: string
    activityAlreadyLogged?: boolean
  }) {
    void params.activityAlreadyLogged
    const requestId = this.resolveClientFacingRequestId(params.attachment)
    if (requestId) {
      const message = await this.prisma.projectRequestMessage.create({
        data: {
          requestId,
          authorUserId: params.actor.id,
          authorRole: ProjectMessageAuthorRole.CLIENT,
          body: params.body,
          messageKind: ProjectMessageKind.SYSTEM,
        },
        include: {
          author: { select: userActorSelect },
          attachmentLinks: { include: { attachment: true } },
        },
      })
      const serialized = serializeMessage(message)
      this.messaging.emitThreadMessage(requestId, serialized as Record<string, unknown>)
    }

    const href = `${this.notifications.adminClientWorkspaceLink(params.attachment.project.organizationId)}?tab=projects&projectId=${params.attachment.projectId}&projectTab=progress`
    void this.notifications.notifyAdmins({
      organizationId: params.attachment.project.organizationId,
      type: params.notificationType,
      title: params.notificationTitle,
      body: params.body,
      href,
      projectId: params.attachment.projectId,
      requestId: requestId ?? undefined,
    })
  }

  private resolveClientFacingRequestId(attachment: {
    requestId: string | null
    messageLinks: Array<{
      message: {
        requestId: string
        request: { id: string; type: ProjectRequestType }
      }
    }>
  }): string | null {
    const linked = attachment.messageLinks.map((link) => link.message.request)
    const progress = linked.find((r) => r.type === ProjectRequestType.PROGRESS)
    if (progress) return progress.id
    const onboarding = linked.find((r) => r.type === ProjectRequestType.ONBOARDING)
    if (onboarding) return onboarding.id
    const clientFacing = linked.find(
      (r) =>
        r.type !== ProjectRequestType.INTERNAL &&
        r.type !== ProjectRequestType.CANCELLATION,
    )
    if (clientFacing) return clientFacing.id
    return attachment.requestId
  }

  async setReaction(
    actor: Actor,
    attachmentId: string,
    kindInput: string,
  ): Promise<ProjectAttachmentWithReactions> {
    const kind = parseKind(kindInput)
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        projectId: true,
        visibility: true,
        requestId: true,
        messageLinks: {
          select: {
            message: {
              select: {
                requestId: true,
                request: { select: { id: true, type: true } },
              },
            },
          },
        },
      },
    })
    if (!attachment) throw new NotFoundException('File not found')

    await this.assertAccess(actor, attachment.projectId, attachment.visibility, 'write')

    await this.prisma.projectFileReaction.upsert({
      where: {
        attachmentId_userId: {
          attachmentId,
          userId: actor.id,
        },
      },
      create: { attachmentId, userId: actor.id, kind },
      update: { kind },
    })

    await this.applyApprovalSideEffects(actor, attachmentId, kind)
    this.notifyThreadAttachment(attachment)
    return this.getAttachmentWithReactions(actor, attachmentId)
  }

  async clearReaction(
    actor: Actor,
    attachmentId: string,
  ): Promise<ProjectAttachmentWithReactions> {
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        projectId: true,
        visibility: true,
        requestId: true,
        messageLinks: {
          select: {
            message: {
              select: {
                requestId: true,
                request: { select: { id: true, type: true } },
              },
            },
          },
        },
      },
    })
    if (!attachment) throw new NotFoundException('File not found')

    await this.assertAccess(actor, attachment.projectId, attachment.visibility, 'write')

    await this.prisma.projectFileReaction.deleteMany({
      where: { attachmentId, userId: actor.id },
    })

    await this.applyApprovalSideEffects(actor, attachmentId, null)
    this.notifyThreadAttachment(attachment)
    return this.getAttachmentWithReactions(actor, attachmentId)
  }

  async getAttachmentWithReactions(
    actor: Actor,
    attachmentId: string,
  ): Promise<ProjectAttachmentWithReactions> {
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        reactions: { select: { userId: true, kind: true } },
      },
    })
    if (!attachment) throw new NotFoundException('File not found')

    await this.assertAccess(actor, attachment.projectId, attachment.visibility)

    return this.serializeAttachment(attachment, actor.id)
  }

  async listReactionsForProject(
    actor: Actor,
    projectId: string,
  ): Promise<FileReactionsResponse> {
    await this.assertAccess(actor, projectId, ProjectAttachmentVisibility.CLIENT)

    const visibilityWhere = this.isClient(actor)
      ? { visibility: ProjectAttachmentVisibility.CLIENT }
      : {}

    const attachments = await this.prisma.projectAttachment.findMany({
      where: {
        projectId,
        ...visibilityWhere,
        OR: [
          { reactions: { some: {} } },
          { reviewRequested: true },
          { approvedAt: { not: null } },
          { changesRequestedAt: { not: null } },
        ],
      },
      include: {
        reactions: { select: { userId: true, kind: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      items: attachments.map((a) => this.serializeAttachment(a, actor.id)),
    }
  }

  async listTopPicksForProject(
    actor: Actor,
    projectId: string,
    tagFilters: string[] = [],
  ): Promise<TopPicksResponse> {
    await this.assertAccess(actor, projectId, ProjectAttachmentVisibility.CLIENT)

    const filterKinds = tagFilters
      .map((t) => {
        try {
          return parseKind(t)
        } catch {
          return null
        }
      })
      .filter((k): k is ProjectFileReactionKind => k != null)

    const visibilityWhere = this.isClient(actor)
      ? { visibility: ProjectAttachmentVisibility.CLIENT }
      : {}

    const attachments = await this.prisma.projectAttachment.findMany({
      where: {
        projectId,
        ...visibilityWhere,
        reactions: {
          some: { kind: { in: POSITIVE_REACTION_KINDS } },
        },
      },
      include: {
        reactions: { select: { userId: true, kind: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    let items = attachments.map((a) => this.serializeAttachment(a, actor.id))
    if (filterKinds.length > 0) {
      items = items.filter((item) =>
        filterKinds.some((kind) => item.tags.some((tag) => tag.kind === kind)),
      )
    }

    return {
      items,
      availableTags: this.aggregateTags(
        attachments.flatMap((a) => a.reactions.map((r) => r.kind)),
      ),
    }
  }

  async listTopPicksForClientOrg(
    client: AuthenticatedClient,
    tagFilters: string[] = [],
  ): Promise<TopPicksResponse> {
    const filterKinds = tagFilters
      .map((t) => {
        try {
          return parseKind(t)
        } catch {
          return null
        }
      })
      .filter((k): k is ProjectFileReactionKind => k != null)

    const attachments = await this.prisma.projectAttachment.findMany({
      where: {
        visibility: ProjectAttachmentVisibility.CLIENT,
        project: this.clientAccess.accessibleProjectsWhere(client),
        reactions: {
          some: { kind: { in: POSITIVE_REACTION_KINDS } },
        },
      },
      include: {
        reactions: { select: { userId: true, kind: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    let items = attachments.map((a) => this.serializeAttachment(a, client.id))
    if (filterKinds.length > 0) {
      items = items.filter((item) =>
        filterKinds.some((kind) => item.tags.some((tag) => tag.kind === kind)),
      )
    }

    return {
      items,
      availableTags: this.aggregateTags(
        attachments.flatMap((a) => a.reactions.map((r) => r.kind)),
      ),
    }
  }

  async countTopPicksForClient(client: AuthenticatedClient): Promise<number> {
    return this.prisma.projectAttachment.count({
      where: {
        visibility: ProjectAttachmentVisibility.CLIENT,
        project: this.clientAccess.accessibleProjectsWhere(client),
        reactions: {
          some: { kind: { in: POSITIVE_REACTION_KINDS } },
        },
      },
    })
  }
}
