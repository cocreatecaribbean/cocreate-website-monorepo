import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ProjectAttachmentVisibility,
  ProjectFileReactionKind,
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

const REACTION_META: Record<
  ProjectFileReactionKind,
  { label: string; isPositive: boolean }
> = {
  LOVE_THIS: { label: 'Love this', isPositive: true },
  SHIP_IT: { label: 'Ship it', isPositive: true },
  GREAT_DIRECTION: { label: 'Great direction', isPositive: true },
  ANOTHER_VERSION: { label: 'Another version', isPositive: false },
  NEEDS_A_TWEAK: { label: 'Needs a tweak', isPositive: false },
}

export const POSITIVE_REACTION_KINDS: ProjectFileReactionKind[] = [
  ProjectFileReactionKind.LOVE_THIS,
  ProjectFileReactionKind.SHIP_IT,
  ProjectFileReactionKind.GREAT_DIRECTION,
]

function parseKind(raw: string): ProjectFileReactionKind {
  const upper = raw.trim().toUpperCase()
  if (!(Object.values(ProjectFileReactionKind) as string[]).includes(upper)) {
    throw new BadRequestException('Invalid reaction')
  }
  return upper as ProjectFileReactionKind
}

type Actor = AuthenticatedClient | AuthenticatedAgencyUser

@Injectable()
export class ProjectFileReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientAccess: ClientAccessService,
    private readonly agencyAccess: AgencyAccessService,
    private readonly messaging: MessagingEmitService,
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
        messageLinks: { select: { message: { select: { requestId: true } } } },
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
        messageLinks: { select: { message: { select: { requestId: true } } } },
      },
    })
    if (!attachment) throw new NotFoundException('File not found')

    await this.assertAccess(actor, attachment.projectId, attachment.visibility, 'write')

    await this.prisma.projectFileReaction.deleteMany({
      where: { attachmentId, userId: actor.id },
    })

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
        reactions: { some: {} },
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
