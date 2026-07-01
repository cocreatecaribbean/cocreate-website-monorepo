import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  CancellationOutcome,
  ClientOrgRole,
  ClientProjectPhase,
  ClientProjectStatus,
  Prisma,
  ProjectAttachmentVisibility,
  ProjectMessageAuthorRole,
  ProjectMessageKind,
  ProjectRequestStatus,
  ProjectRequestType,
  PortalNotificationType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import type {
  AuthenticatedAdmin,
  AuthenticatedAgencyUser,
  AuthenticatedClient,
} from '../auth/auth.service'
import { AgencyAccessService } from '../auth/agency-access.service'
import { isCollaboratorRole } from '../auth/admin-roles'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectRealtimeService } from './project-realtime.service'
import { ProjectStorageService } from './project-storage.service'
import type { ClientRecentActivityItem } from '@cocreate/api-contracts/v1/client-portal'
import type {
  CreateCheckpointInput,
  CreateCancellationRequestInput,
  CreateChangeRequestInput,
  CreatePhaseApprovalInput,
  CreateProjectInput,
  CreateProjectForAdminInput,
  ResolveCancellationInput,
  RegisterAttachmentInput,
  UpdateProjectInput,
  CreateRequestMessageInput,
  UpdateRequestInput,
  UploadUrlInput,
  RegisterCoverInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { ClientTeamService } from './client-team.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import {
  serializeActivity,
  serializeApprovalRecord,
  serializeAttachment,
  serializeAttachmentWithUsage,
  serializeMessage,
  serializeProject,
  serializeRequest,
} from './projects.serializer'
import { resolveActorLabel, userActorSelect } from '../users/display-name'
import {
  CLIENT_RECENT_ACTIVITY_ACTIONS,
  getActivityHref,
  getClientActivityHref,
  getClientActivitySummary,
  RECENT_ACTIVITY_ACTIONS,
} from './project-labels'

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name)
  private warnedMissingMessageAttachmentTable = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ProjectStorageService,
    private readonly notifications: ProjectNotificationsService,
    private readonly mail: ProjectNotificationMailService,
    private readonly clientAccess: ClientAccessService,
    private readonly agencyAccess: AgencyAccessService,
    private readonly realtime: ProjectRealtimeService,
    private readonly clientTeam: ClientTeamService,
    private readonly supabaseAuth: SupabaseAuthService,
  ) {}

  private portalCallbackUrl() {
    const portalBase = process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
    return `${portalBase}/auth/callback`
  }

  private async notifyThreadUpdate(
    requestId: string,
    reason: 'message' | 'checkpoint' | 'status' | 'attachment',
    messageId?: string,
  ) {
    await this.realtime.publishThreadUpdate(requestId, { reason, messageId })
  }

  async authorizeThreadRealtime(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    requestId: string,
  ) {
    await this.getRequestForActor(requestId, actor)
    return {
      enabled: this.realtime.isConfigured,
      channel: this.realtime.channelName(requestId),
    }
  }

  private async logActivity(
    projectId: string,
    actorUserId: string,
    action: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    const row = await this.prisma.projectActivity.create({
      data: {
        projectId,
        actorUserId,
        action,
        metadata: metadata ?? undefined,
      },
    })
    return serializeActivity(row)
  }

  private async resolveCoverImageUrl(
    coverStoragePath: string | null | undefined,
  ): Promise<string | null> {
    if (!coverStoragePath || !this.storage.isConfigured) return null
    try {
      const signed = await this.storage.createDownloadUrl(coverStoragePath)
      return signed.signedUrl
    } catch {
      return null
    }
  }

  private stripInternalFromProject<T extends { requests?: Array<{ type: string }> }>(
    project: T,
  ): T {
    if (!project.requests?.length) return project
    return {
      ...project,
      requests: project.requests.filter((r) => r.type !== ProjectRequestType.INTERNAL),
    }
  }

  private async serializeProjectWithCover(
    project: Parameters<typeof serializeProject>[0],
  ) {
    const base = serializeProject(project)
    const coverImageUrl = await this.resolveCoverImageUrl(
      (project as { coverStoragePath?: string | null }).coverStoragePath,
    )
    return { ...base, coverImageUrl }
  }

  private serializeProjectsForList(
    projects: Parameters<typeof serializeProject>[0][],
  ) {
    return projects.map((p) => ({
      ...serializeProject(p),
      coverImageUrl: null,
    }))
  }

  private serializeProjectsWithCover(
    projects: Parameters<typeof serializeProject>[0][],
  ) {
    return Promise.all(projects.map((p) => this.serializeProjectWithCover(p)))
  }

  private async getProjectForClient(
    client: AuthenticatedClient,
    projectId: string,
    required: 'VIEW' | 'MANAGE' = 'VIEW',
  ) {
    await this.clientAccess.assertProjectAccess(client, projectId, required)

    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
        approvedBy: { select: userActorSelect },
      },
    })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  private async getProjectById(projectId: string) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
        approvedBy: { select: userActorSelect },
      },
    })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  private requestInclude() {
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
    }
  }

  private async linkAttachmentsToMessage(
    messageId: string,
    projectId: string,
    attachmentIds: string[] | undefined,
    requestType?: ProjectRequestType,
  ) {
    const ids = [...new Set(attachmentIds ?? [])]
    if (ids.length === 0) return

    const attachments = await this.prisma.projectAttachment.findMany({
      where: { id: { in: ids }, projectId },
      select: { id: true },
    })
    if (attachments.length !== ids.length) {
      throw new BadRequestException(
        'One or more attachments are invalid for this project',
      )
    }

    await this.prisma.projectRequestMessageAttachment.createMany({
      data: ids.map((attachmentId) => ({ messageId, attachmentId })),
      skipDuplicates: true,
    })

    if (requestType === ProjectRequestType.INTERNAL) {
      await this.prisma.projectAttachment.updateMany({
        where: { id: { in: ids }, projectId },
        data: { visibility: ProjectAttachmentVisibility.INTERNAL },
      })
    }
  }

  private groupProjectAttachments(
    projectId: string,
    projectTitle: string,
    attachments: Array<{
      messageLinks: Array<{ createdAt: Date }>
    } & Parameters<typeof serializeAttachmentWithUsage>[0]>,
  ) {
    const serialized = attachments.map((row) =>
      serializeAttachmentWithUsage(row),
    )
    return {
      projectId,
      projectTitle,
      libraryUploads: serialized.filter((file) => !file.usedInThreads),
      usedInThreads: serialized.filter((file) => file.usedInThreads),
    }
  }

  private normalizeFileQuery(input?: {
    projectId?: string
    q?: string
    cursor?: string
    limit?: number
  }) {
    const q = input?.q?.trim()
    const limit = Math.max(1, Math.min(100, input?.limit ?? 100))
    return {
      projectId: input?.projectId?.trim() || undefined,
      q: q && q.length > 0 ? q : undefined,
      cursor: input?.cursor?.trim() || undefined,
      limit,
    }
  }

  private async listFilesForProjects(
    projects: Array<{ id: string; title: string }>,
    options?: {
      projectId?: string
      q?: string
      cursor?: string
      limit?: number
      visibility?: ProjectAttachmentVisibility
    },
  ) {
    const query = this.normalizeFileQuery(options)
    const requestedProjectIds = projects.map((project) => project.id)
    if (requestedProjectIds.length === 0) {
      return { projects: [], files: [], nextCursor: null as string | null }
    }

    if (query.projectId && !requestedProjectIds.includes(query.projectId)) {
      throw new BadRequestException('Invalid project filter for this organization')
    }

    const projectIds = query.projectId ? [query.projectId] : requestedProjectIds
    const where: Prisma.ProjectAttachmentWhereInput = {
      projectId: { in: projectIds },
      ...(options?.visibility ? { visibility: options.visibility } : {}),
      ...(query.cursor ? { id: { lt: query.cursor } } : {}),
      ...(query.q
        ? {
            OR: [
              { fileName: { contains: query.q, mode: 'insensitive' } },
              { mimeType: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    let rows: Array<
      Parameters<typeof serializeAttachmentWithUsage>[0] & {
        messageLinks: Array<{ createdAt: Date }>
      }
    >
    try {
      rows = await this.prisma.projectAttachment.findMany({
        where,
        include: { messageLinks: { select: { createdAt: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: query.limit + 1,
      })
    } catch (error) {
      const isMissingMessageLinksTable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2021' &&
        String(error.meta?.driverAdapterError ?? '').includes(
          'ProjectRequestMessageAttachment',
        )

      if (!isMissingMessageLinksTable) throw error

      if (!this.warnedMissingMessageAttachmentTable) {
        this.warnedMissingMessageAttachmentTable = true
        this.logger.warn(
          'ProjectRequestMessageAttachment table is missing. Files endpoints are using compatibility fallback. Run DB migrations to enable full thread-link file metadata.',
        )
      }

      const fallbackRows = await this.prisma.projectAttachment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: query.limit + 1,
      })
      rows = fallbackRows.map((row) => ({ ...row, messageLinks: [] }))
    }

    const hasMore = rows.length > query.limit
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows
    const grouped = new Map<string, typeof pageRows>()
    for (const row of pageRows) {
      const bucket = grouped.get(row.projectId) ?? []
      bucket.push(row)
      grouped.set(row.projectId, bucket)
    }

    const projectTitleById = new Map(
      projects.map((project) => [project.id, project.title]),
    )
    const filteredProjects = query.projectId
      ? projects.filter((project) => project.id === query.projectId)
      : projects
    const groupedProjects = filteredProjects.map((project) =>
      this.groupProjectAttachments(
        project.id,
        project.title,
        grouped.get(project.id) ?? [],
      ),
    )
    const files = pageRows.map((row) => ({
      ...serializeAttachmentWithUsage(row),
      projectTitle: projectTitleById.get(row.projectId) ?? '',
    }))

    return {
      projects: groupedProjects,
      files,
      nextCursor: hasMore ? pageRows[pageRows.length - 1]!.id : null,
    }
  }

  private projectListInclude() {
    return {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: userActorSelect },
      approvedBy: { select: userActorSelect },
      completedBy: { select: userActorSelect },
      requests: {
        select: {
          id: true,
          type: true,
          status: true,
          messages: {
            where: {
              messageKind: ProjectMessageKind.CHECKPOINT,
              requiresClientApproval: true,
              supersededAt: null,
              clientApprovedAt: null,
            },
            select: {
              id: true,
              messageKind: true,
              requiresClientApproval: true,
              supersededAt: true,
              clientApprovedAt: true,
            },
          },
        },
      },
    }
  }

  private async supersedePendingCheckpoints(requestId: string) {
    await this.prisma.projectRequestMessage.updateMany({
      where: {
        requestId,
        requiresClientApproval: true,
        supersededAt: null,
        clientApprovedAt: null,
      },
      data: { supersededAt: new Date() },
    })
  }

  private async ensureProgressThread(projectId: string, createdByUserId: string) {
    return this.prisma.projectRequest.upsert({
      where: {
        projectId_type: { projectId, type: ProjectRequestType.PROGRESS },
      },
      create: {
        projectId,
        type: ProjectRequestType.PROGRESS,
        title: 'Project progress',
        description: 'Collaboration and progress approvals',
        createdByUserId,
        status: ProjectRequestStatus.OPEN,
      },
      update: {},
    })
  }

  private async ensureInternalThread(projectId: string, createdByUserId: string) {
    return this.prisma.projectRequest.upsert({
      where: {
        projectId_type: { projectId, type: ProjectRequestType.INTERNAL },
      },
      create: {
        projectId,
        type: ProjectRequestType.INTERNAL,
        title: 'Team review',
        description: 'Internal CoCreate discussion — not visible to the client.',
        createdByUserId,
        status: ProjectRequestStatus.OPEN,
      },
      update: {},
    })
  }

  private resolveThreadAuthorId(
    project: { approvedByUserId: string | null; createdByUserId: string },
    actorId: string,
  ) {
    return project.approvedByUserId ?? project.createdByUserId ?? actorId
  }

  private projectHasInternalThread(
    project: { requests?: Array<{ type: ProjectRequestType }> },
  ) {
    return (
      project.requests?.some((r) => r.type === ProjectRequestType.INTERNAL) ?? false
    )
  }

  private async ensureInternalThreadsForProjects<
    T extends {
      id: string
      approvedByUserId: string | null
      createdByUserId: string
      requests?: Array<{ type: ProjectRequestType } & Record<string, unknown>>
    },
  >(projects: T[], actorId: string): Promise<T[]> {
    const missing = projects.filter((p) => !this.projectHasInternalThread(p))
    if (missing.length === 0) return projects

    await Promise.all(
      missing.map((p) =>
        this.ensureInternalThread(
          p.id,
          this.resolveThreadAuthorId(p, actorId),
        ),
      ),
    )

    const created = await this.prisma.projectRequest.findMany({
      where: {
        projectId: { in: missing.map((p) => p.id) },
        type: ProjectRequestType.INTERNAL,
      },
      include: this.requestInclude(),
    })
    const byProjectId = new Map(created.map((r) => [r.projectId, r]))

    return projects.map((project) => {
      if (this.projectHasInternalThread(project)) return project
      const internal = byProjectId.get(project.id)
      if (!internal) return project
      return {
        ...project,
        requests: [...(project.requests ?? []), internal],
      }
    })
  }

  private projectDetailInclude() {
    return {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: userActorSelect },
      approvedBy: { select: userActorSelect },
      completedBy: { select: userActorSelect },
      requests: {
        orderBy: { createdAt: 'desc' as const },
        include: this.requestInclude(),
      },
      attachments: { orderBy: { createdAt: 'desc' as const } },
      activities: {
        orderBy: { createdAt: 'desc' as const },
        take: 30,
        include: { actor: { select: userActorSelect } },
      },
    }
  }

  private projectOverviewInclude() {
    return {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: userActorSelect },
      approvedBy: { select: userActorSelect },
      completedBy: { select: userActorSelect },
      requests: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          projectId: true,
          type: true,
          status: true,
          title: true,
          description: true,
          targetPhase: true,
          createdByUserId: true,
          resolvedByUserId: true,
          resolvedAt: true,
          cancellationOutcome: true,
          cancellationFeeAmount: true,
          cancellationFeeNotes: true,
          createdAt: true,
          updatedAt: true,
          createdBy: { select: userActorSelect },
          resolvedBy: { select: userActorSelect },
          messages: {
            where: {
              messageKind: ProjectMessageKind.CHECKPOINT,
              requiresClientApproval: true,
              supersededAt: null,
              clientApprovedAt: null,
            },
            select: {
              id: true,
              messageKind: true,
              requiresClientApproval: true,
              supersededAt: true,
              clientApprovedAt: true,
            },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          projectId: true,
          requestId: true,
          storagePath: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          visibility: true,
          uploadedByUserId: true,
          createdAt: true,
        },
      },
      activities: {
        orderBy: { createdAt: 'desc' as const },
        take: 10,
        include: { actor: { select: userActorSelect } },
      },
    }
  }

  private projectIncludeForView(view: 'overview' | 'full') {
    return view === 'full' ? this.projectDetailInclude() : this.projectOverviewInclude()
  }

  private mergeEnsuredRequest<
    T extends { requests?: Array<{ type: ProjectRequestType }> },
  >(project: T, request: { type: ProjectRequestType }): T {
    if (project.requests?.some((r) => r.type === request.type)) {
      return project
    }
    return {
      ...project,
      requests: [...(project.requests ?? []), request],
    } as T
  }

  private async getRequestForActor(
    requestId: string,
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
  ) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
      include: {
        ...this.requestInclude(),
        project: { include: { organization: { select: { id: true, name: true } } } },
      },
    })
    if (!request) throw new NotFoundException('Request not found')

    if ('organization' in actor && actor.organization) {
      if (request.type === ProjectRequestType.INTERNAL) {
        throw new ForbiddenException('Request not found')
      }
      await this.clientAccess.assertProjectAccess(
        actor,
        request.projectId,
        'VIEW',
      )
    } else {
      await this.agencyAccess.assertCanAccessProject(actor, request.projectId)
      if (!this.agencyAccess.canReadRequest(actor, request.type)) {
        throw new ForbiddenException('You cannot access this conversation')
      }
    }

    return request
  }

  // ─── Client projects ────────────────────────────────────────────────────────

  async listForClient(client: AuthenticatedClient) {
    const projects = await this.prisma.clientProject.findMany({
      where: this.clientAccess.accessibleProjectsWhere(client),
      orderBy: { updatedAt: 'desc' },
      include: this.projectListInclude(),
    })
    return this.serializeProjectsWithCover(projects)
  }

  async createForClient(client: AuthenticatedClient, dto: CreateProjectInput) {
    await this.clientAccess.assertCanCreateProject(client)
    const org = client.organization
    if (!org) throw new ForbiddenException('No organization linked to your account')

    const project = await this.prisma.clientProject.create({
      data: {
        organizationId: org.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        status: ClientProjectStatus.SUBMITTED,
        phase: ClientProjectPhase.DISCOVERY,
        createdByUserId: client.id,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
      },
    })

    await this.logActivity(project.id, client.id, 'project.submitted', {
      title: project.title,
    })

    const adminLink = this.notifications.adminClientWorkspaceLink(org.id)
    const emailContent = this.mail.buildProjectSubmittedEmail({
      orgName: org.name,
      projectTitle: project.title,
      adminLink,
    })

    await this.notifications.notifyAdmins({
      organizationId: org.id,
      type: PortalNotificationType.PROJECT_SUBMITTED,
      title: `New project: ${project.title}`,
      body: `${org.name} submitted "${project.title}" for agency review.`,
      href: adminLink,
      projectId: project.id,
      email: emailContent,
    })

    await this.prisma.projectRequest.create({
      data: {
        projectId: project.id,
        type: ProjectRequestType.ONBOARDING,
        title: project.title,
        description: dto.description.trim(),
        createdByUserId: client.id,
        status: ProjectRequestStatus.OPEN,
        messages: {
          create: {
            authorUserId: client.id,
            authorRole: ProjectMessageAuthorRole.CLIENT,
            body: dto.description.trim(),
            messageKind: ProjectMessageKind.CHAT,
          },
        },
      },
    })

    const full = await this.prisma.clientProject.findUnique({
      where: { id: project.id },
      include: this.projectDetailInclude(),
    })
    return this.serializeProjectWithCover(full!)
  }

  async getForClient(
    client: AuthenticatedClient,
    projectId: string,
    view: 'overview' | 'full' = 'overview',
  ) {
    await this.clientAccess.assertProjectAccess(client, projectId, 'VIEW')

    let project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: this.projectIncludeForView(view),
    })
    if (!project) throw new NotFoundException('Project not found')

    if (project.status === ClientProjectStatus.ACTIVE) {
      const progress = await this.ensureProgressThread(
        projectId,
        project.approvedByUserId ?? project.createdByUserId,
      )
      project = this.mergeEnsuredRequest(project, progress)
    }

    return this.serializeProjectWithCover(this.stripInternalFromProject(project))
  }

  async createChangeRequest(
    client: AuthenticatedClient,
    projectId: string,
    dto: CreateChangeRequestInput,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    if (project.status === ClientProjectStatus.SUBMITTED) {
      throw new BadRequestException('Project must be onboarded before sending progress messages')
    }

    const progress = await this.ensureProgressThread(project.id, client.id)
    const body = `${dto.title.trim()}\n\n${dto.description.trim()}`
    return this.addRequestMessage(client, progress.id, { body })
  }

  async createPhaseApproval(
    client: AuthenticatedClient,
    projectId: string,
    dto: CreatePhaseApprovalInput,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    if (project.status !== ClientProjectStatus.ACTIVE) {
      throw new BadRequestException('Only active projects can request phase updates')
    }

    const progress = await this.ensureProgressThread(project.id, client.id)
    const body =
      dto.description?.trim() ||
      `Client indicated readiness for ${dto.targetPhase.replace(/_/g, ' ').toLowerCase()}.`
    return this.addRequestMessage(client, progress.id, { body })
  }

  async listOpenRequestsForClient(client: AuthenticatedClient) {
    return this.listPendingCheckpointsForClient(client)
  }

  async listPendingCheckpointsForClient(client: AuthenticatedClient) {
    const requests = await this.prisma.projectRequest.findMany({
      where: {
        type: ProjectRequestType.PROGRESS,
        project: this.clientAccess.accessibleProjectsWhere(client),
        messages: {
          some: {
            requiresClientApproval: true,
            supersededAt: null,
            clientApprovedAt: null,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    return requests.map(serializeRequest)
  }

  async listApprovalHistoryForClient(client: AuthenticatedClient) {
    const records = await this.prisma.clientApprovalRecord.findMany({
      where: { project: this.clientAccess.accessibleProjectsWhere(client) },
      orderBy: { approvedAt: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        message: {
          include: {
            attachmentLinks: { include: { attachment: true } },
          },
        },
        request: {
          include: {
            attachments: true,
            messages: {
              orderBy: { createdAt: 'asc' as const },
              select: {
                id: true,
                createdAt: true,
                attachmentLinks: { select: { attachmentId: true } },
              },
            },
          },
        },
      },
    })
    return records.map((r) => ({
      ...serializeApprovalRecord(r),
      projectTitle: r.project.title,
    }))
  }

  async createCancellationRequest(
    client: AuthenticatedClient,
    projectId: string,
    dto: CreateCancellationRequestInput,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    if (
      project.status !== ClientProjectStatus.ACTIVE &&
      project.status !== ClientProjectStatus.ON_HOLD
    ) {
      throw new BadRequestException(
        'Only active or on-hold projects can request cancellation',
      )
    }

    const reason =
      dto.reason?.trim() ||
      'Client has requested to cancel this project.'

    const existing = await this.prisma.projectRequest.findUnique({
      where: {
        projectId_type: { projectId: project.id, type: ProjectRequestType.CANCELLATION },
      },
    })
    if (
      existing &&
      (existing.status === ProjectRequestStatus.RESOLVED ||
        existing.status === ProjectRequestStatus.REJECTED)
    ) {
      throw new BadRequestException('A cancellation request was already resolved for this project')
    }

    const request = await this.prisma.projectRequest.upsert({
      where: {
        projectId_type: { projectId: project.id, type: ProjectRequestType.CANCELLATION },
      },
      create: {
        projectId: project.id,
        type: ProjectRequestType.CANCELLATION,
        title: `Cancellation: ${project.title}`,
        description: reason,
        createdByUserId: client.id,
        status: ProjectRequestStatus.OPEN,
        messages: {
          create: {
            authorUserId: client.id,
            authorRole: ProjectMessageAuthorRole.CLIENT,
            body: reason,
            messageKind: ProjectMessageKind.CHAT,
          },
        },
      },
      update: {
        status: ProjectRequestStatus.OPEN,
        description: reason,
      },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })

    await this.logActivity(project.id, client.id, 'request.cancellation_requested', {
      requestId: request.id,
    })

    const adminLink = `${this.notifications.adminClientWorkspaceLink(project.organizationId)}?tab=projects`
    await this.notifications.notifyAdmins({
      organizationId: project.organizationId,
      type: PortalNotificationType.CANCELLATION_REQUESTED,
      title: `Cancellation requested: ${project.title}`,
      body: reason,
      href: adminLink,
      projectId: project.id,
      requestId: request.id,
      email: {
        subject: `Cancellation requested: ${project.title}`,
        html: `<p>A client requested cancellation for <strong>${project.title}</strong>.</p><p>${reason}</p><p><a href="${adminLink}">Review in Admin Center</a></p>`,
        text: `Cancellation requested: ${project.title}\n${reason}\n${adminLink}`,
        actionLink: adminLink,
      },
    })

    return serializeRequest(request)
  }

  async approveCheckpoint(
    client: AuthenticatedClient,
    requestId: string,
    messageId: string,
  ) {
    const request = await this.getRequestForActor(requestId, client)
    if (request.type !== ProjectRequestType.PROGRESS) {
      throw new BadRequestException('Only progress checkpoints can be approved')
    }

    const message = await this.prisma.projectRequestMessage.findFirst({
      where: {
        id: messageId,
        requestId,
        requiresClientApproval: true,
        supersededAt: null,
        clientApprovedAt: null,
      },
    })
    if (!message) {
      throw new BadRequestException('No pending approval on this message')
    }

    const latestPending = await this.prisma.projectRequestMessage.findFirst({
      where: {
        requestId,
        requiresClientApproval: true,
        supersededAt: null,
        clientApprovedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
    if (latestPending?.id !== messageId) {
      throw new BadRequestException(
        'A newer review is available — please approve the latest message from CoCreate',
      )
    }

    const now = new Date()
    await this.prisma.$transaction(async (tx) => {
      await tx.projectRequestMessage.update({
        where: { id: messageId },
        data: {
          clientApprovedAt: now,
          clientApprovedByUserId: client.id,
        },
      })

      await tx.clientApprovalRecord.create({
        data: {
          projectId: request.projectId,
          requestId,
          messageId,
          title: request.title,
          summary: message.body.slice(0, 500),
          targetPhase: message.checkpointTargetPhase,
          approvedByUserId: client.id,
        },
      })

      if (message.checkpointTargetPhase) {
        await tx.clientProject.update({
          where: { id: request.projectId },
          data: { phase: message.checkpointTargetPhase },
        })
      }
    })

    await this.logActivity(request.projectId, client.id, 'checkpoint.approved', {
      requestId,
      messageId,
    })

    const adminLink = `${this.notifications.adminClientWorkspaceLink(request.project.organizationId)}?tab=projects`
    await this.notifications.notifyAdmins({
      organizationId: request.project.organizationId,
      type: PortalNotificationType.CHECKPOINT_APPROVED,
      title: `Approved: ${request.title}`,
      body: message.body.slice(0, 200),
      href: adminLink,
      projectId: request.projectId,
      requestId,
    })

    const approved = serializeMessage(
      (await this.prisma.projectRequestMessage.findUnique({
        where: { id: messageId },
        include: { author: { select: userActorSelect } },
      }))!,
    )
    await this.notifyThreadUpdate(requestId, 'checkpoint', messageId)
    return approved
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async listAllForAdmin(actor: AuthenticatedAgencyUser) {
    const where = await this.agencyAccess.accessibleProjectsWhere(actor)
    const projects = await this.prisma.clientProject.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.projectListInclude(),
    })
    return this.serializeProjectsForList(projects)
  }

  async listForOrganization(actor: AuthenticatedAgencyUser, organizationId: string) {
    if (!this.agencyAccess.isCoreTeam(actor)) {
      throw new ForbiddenException('Organization workspace requires core team access')
    }
    const projects = await this.prisma.clientProject.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
        approvedBy: { select: userActorSelect },
        completedBy: { select: userActorSelect },
        requests: {
          orderBy: { createdAt: 'desc' },
          include: this.requestInclude(),
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 25,
          include: { actor: { select: userActorSelect } },
        },
      },
    })
    const withInternal = await this.ensureInternalThreadsForProjects(
      projects,
      actor.id,
    )
    return this.serializeProjectsForList(withInternal)
  }

  async getForAdmin(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    view: 'overview' | 'full' = 'overview',
  ) {
    await this.agencyAccess.assertCanAccessProject(actor, projectId)
    let project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: this.projectIncludeForView(view),
    })
    if (!project) throw new NotFoundException('Project not found')

    if (!this.projectHasInternalThread(project)) {
      const internal = await this.ensureInternalThread(
        projectId,
        this.resolveThreadAuthorId(project, actor.id),
      )
      project = this.mergeEnsuredRequest(project, internal)
    }

    return this.serializeProjectWithCover(project)
  }

  async unreadInboxCountForAdmin(admin: AuthenticatedAdmin, organizationId: string) {
    const count = await this.notifications.unreadInboxCountForAdmin(
      admin.id,
      organizationId,
    )
    return { count }
  }

  async markInboxReadForAdmin(
    admin: AuthenticatedAdmin,
    organizationId: string,
    requestId?: string,
  ) {
    if (requestId) {
      return this.notifications.markInboxReadForRequest(
        admin.id,
        organizationId,
        requestId,
      )
    }
    return this.notifications.markAllInboxReadForOrg(admin.id, organizationId)
  }

  async listInboxForOrganization(organizationId: string) {
    const requests = await this.prisma.projectRequest.findMany({
      where: {
        project: { organizationId },
        status: { in: [ProjectRequestStatus.OPEN, ProjectRequestStatus.IN_PROGRESS] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    return requests.map(serializeRequest)
  }

  async getRequestThread(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    requestId: string,
  ) {
    const request = await this.getRequestForActor(requestId, actor)
    return serializeRequest({
      ...request,
      project: request.project,
    })
  }

  async listActivityForOrganization(organizationId: string) {
    const activities = await this.prisma.projectActivity.findMany({
      where: { project: { organizationId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: userActorSelect },
        project: { select: { id: true, title: true } },
      },
    })
    return activities.map((a) => ({
      ...serializeActivity(a),
      actorEmail: a.actor.email,
      projectTitle: a.project.title,
    }))
  }

  async resolveOrganizationPortalState(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    })
    if (!org) throw new NotFoundException('Organization not found')

    const clients = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: UserRole.CLIENT,
        status: { not: UserStatus.SUSPENDED },
      },
      select: {
        id: true,
        email: true,
        status: true,
        clientOrgRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const activeUsers = clients.filter((u) => u.status === UserStatus.ACTIVE)
    const invitedUsers = clients
      .filter((u) => u.status === UserStatus.INVITED)
      .map((u) => ({ id: u.id, email: u.email }))

    const suggestedOwner = clients.find(
      (u) => u.status === UserStatus.INVITED && u.clientOrgRole === ClientOrgRole.OWNER,
    )
    const suggestedContactEmail =
      suggestedOwner?.email ?? invitedUsers[0]?.email ?? null

    const hasActiveUsers = activeUsers.length > 0
    const hasPortalUsers = hasActiveUsers || invitedUsers.length > 0

    const portalUsers = clients.map((u) => ({
      id: u.id,
      email: u.email,
      status: u.status,
      clientOrgRole: u.clientOrgRole,
    }))

    return {
      hasActiveUsers,
      hasPortalUsers,
      needsInvite: !hasPortalUsers,
      activeUserCount: activeUsers.length,
      invitedUsers,
      suggestedContactEmail,
      portalUsers,
    }
  }

  async createForAdmin(
    admin: AuthenticatedAgencyUser,
    organizationId: string,
    dto: CreateProjectForAdminInput,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can create projects')
    }
    const recipientUserIds = [...new Set(dto.recipientUserIds ?? [])]
    const inviteEmails = [
      ...new Set(
        [...(dto.inviteEmails ?? []), ...(dto.contactEmail ? [dto.contactEmail] : [])]
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    ]

    if (recipientUserIds.length + inviteEmails.length < 1) {
      throw new BadRequestException('At least one recipient is required.')
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    })
    if (!organization) throw new NotFoundException('Organization not found')

    const recipientUsers =
      recipientUserIds.length > 0
        ? await this.prisma.user.findMany({
            where: {
              id: { in: recipientUserIds },
              organizationId,
              role: UserRole.CLIENT,
              status: { not: UserStatus.SUSPENDED },
            },
            select: { id: true, email: true, status: true },
          })
        : []

    if (recipientUsers.length !== recipientUserIds.length) {
      throw new BadRequestException(
        'One or more selected recipients are invalid for this client.',
      )
    }

    const title = dto.title.trim()
    const description = dto.description.trim()
    const now = new Date()

    const project = await this.prisma.clientProject.create({
      data: {
        organizationId,
        title,
        description,
        status: ClientProjectStatus.ACTIVE,
        phase: ClientProjectPhase.DISCOVERY,
        createdByUserId: admin.id,
        approvedAt: now,
        approvedByUserId: admin.id,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
        approvedBy: { select: userActorSelect },
      },
    })

    await this.logActivity(project.id, admin.id, 'project.created_by_admin', {
      title: project.title,
      adminEmail: admin.email,
    })

    await this.prisma.projectRequest.create({
      data: {
        projectId: project.id,
        type: ProjectRequestType.ONBOARDING,
        title,
        description,
        createdByUserId: admin.id,
        status: ProjectRequestStatus.RESOLVED,
        resolvedAt: now,
        resolvedByUserId: admin.id,
        messages: {
          create: {
            authorUserId: admin.id,
            authorRole: ProjectMessageAuthorRole.ADMIN,
            body: 'Project created by CoCreate team.',
            messageKind: ProjectMessageKind.CHAT,
          },
        },
      },
    })

    await this.ensureProgressThread(project.id, admin.id)
    await this.ensureInternalThread(project.id, admin.id)

    const portalActions = {
      notifiedActiveCount: 0,
      inviteRemindersSent: 0,
      newInvitesSent: 0,
      invitedEmails: [] as string[],
    }

    const portalLink = this.notifications.clientProjectLink(project.id)
    const emailContent = this.mail.buildProjectApprovedEmail({
      projectTitle: title,
      portalLink,
    })

    const activeRecipientIds = recipientUsers
      .filter((u) => u.status === UserStatus.ACTIVE)
      .map((u) => u.id)

    if (activeRecipientIds.length > 0) {
      await this.notifications.notifyClientUsers({
        organizationId,
        userIds: activeRecipientIds,
        type: PortalNotificationType.PROJECT_APPROVED,
        title: `New project ready: ${title}`,
        body: `A new project "${title}" is ready in your portal.`,
        href: portalLink,
        projectId: project.id,
        email: {
          ...emailContent,
          subject: `New project ready: ${title}`,
        },
      })
      portalActions.notifiedActiveCount = activeRecipientIds.length
    }

    const invitedRecipients = recipientUsers.filter(
      (u) => u.status === UserStatus.INVITED,
    )
    const redirectTo = this.portalCallbackUrl()
    const projectInviteCopy = {
      projectTitle: title,
      organizationName: organization.name,
    }

    for (const invited of invitedRecipients) {
      try {
        await this.supabaseAuth.inviteUserByEmail({
          email: invited.email,
          organizationId: organization.id,
          organizationSlug: organization.slug,
          redirectTo,
          projectTitle: title,
          organizationName: organization.name,
          inviteContext: 'invite_reminder',
        })
        portalActions.inviteRemindersSent += 1
      } catch (err) {
        this.logger.warn(
          `Failed to resend portal invite to ${invited.email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        )
      }
    }

    for (const email of inviteEmails) {
      await this.clientTeam.inviteToOrganizationAsAdmin(
        admin,
        organizationId,
        {
          email,
          clientOrgRole: ClientOrgRole.OWNER,
        },
        projectInviteCopy,
      )
      portalActions.newInvitesSent += 1
      portalActions.invitedEmails.push(email)
    }

    const full = await this.prisma.clientProject.findUnique({
      where: { id: project.id },
      include: this.projectDetailInclude(),
    })

    return {
      project: await this.serializeProjectWithCover(full!),
      portalActions,
    }
  }

  async listRecentActivityForAdmin(limit = 15) {
    const capped = Math.min(25, Math.max(1, limit))
    const activities = await this.prisma.projectActivity.findMany({
      where: { action: { in: [...RECENT_ACTIVITY_ACTIONS] } },
      orderBy: { createdAt: 'desc' },
      take: capped,
      include: {
        actor: { select: userActorSelect },
        project: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    })

    return activities.map((a) => {
      const serialized = serializeActivity(a)
      const metadata =
        a.metadata && typeof a.metadata === 'object' && !Array.isArray(a.metadata)
          ? (a.metadata as Record<string, unknown>)
          : null
      const organizationId = a.project.organizationId
      return {
        ...serialized,
        actorEmail: a.actor.email,
        projectTitle: a.project.title,
        organizationId,
        organizationName: a.project.organization.name,
        href: getActivityHref(a.action, organizationId, metadata),
      }
    })
  }

  async listRecentActivityForClient(
    client: AuthenticatedClient,
    limit = 15,
  ): Promise<ClientRecentActivityItem[]> {
    const capped = Math.min(25, Math.max(1, limit))
    const projectIds = await this.clientAccess.listAccessibleProjectIds(client)
    if (projectIds.length === 0) return []

    const activities = await this.prisma.projectActivity.findMany({
      where: {
        action: { in: [...CLIENT_RECENT_ACTIVITY_ACTIONS] },
        projectId: { in: projectIds },
      },
      orderBy: { createdAt: 'desc' },
      take: capped,
      include: {
        actor: { select: userActorSelect },
        project: { select: { id: true, title: true } },
      },
    })

    return activities.map((a) => {
      const serialized = serializeActivity(a)
      const metadata =
        a.metadata && typeof a.metadata === 'object' && !Array.isArray(a.metadata)
          ? (a.metadata as Record<string, unknown>)
          : null
      const actorLabel = serialized.actorLabel ?? 'CoCreate team'
      return {
        id: serialized.id,
        projectId: serialized.projectId,
        projectTitle: a.project.title,
        action: serialized.action,
        actorEmail: serialized.actorEmail,
        actorName: serialized.actorName,
        actorLabel,
        summary: getClientActivitySummary(serialized.action, actorLabel, metadata),
        createdAt: serialized.createdAt,
        href: getClientActivityHref(serialized.action, a.projectId, metadata),
      }
    })
  }

  async approveProject(
    admin: AuthenticatedAgencyUser,
    organizationId: string,
    projectId: string,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can approve projects')
    }
    const project = await this.prisma.clientProject.findFirst({
      where: { id: projectId, organizationId },
      include: { organization: { select: { id: true, name: true } } },
    })
    if (!project) throw new NotFoundException('Project not found')
    if (project.status !== ClientProjectStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted projects can be approved')
    }

    const updated = await this.prisma.clientProject.update({
      where: { id: projectId },
      data: {
        status: ClientProjectStatus.ACTIVE,
        approvedAt: new Date(),
        approvedByUserId: admin.id,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
        approvedBy: { select: userActorSelect },
      },
    })

    await this.logActivity(projectId, admin.id, 'project.approved', {
      adminEmail: admin.email,
    })

    await this.prisma.projectRequest.updateMany({
      where: { projectId, type: ProjectRequestType.ONBOARDING },
      data: {
        status: ProjectRequestStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedByUserId: admin.id,
      },
    })

    await this.ensureProgressThread(projectId, admin.id)
    await this.ensureInternalThread(projectId, admin.id)

    const portalLink = this.notifications.clientProjectLink(projectId)
    const emailContent = this.mail.buildProjectApprovedEmail({
      projectTitle: updated.title,
      portalLink,
    })

    await this.notifications.notifyOrgClients({
      organizationId,
      type: PortalNotificationType.PROJECT_APPROVED,
      title: `Project onboarded: ${updated.title}`,
      body: `Your project "${updated.title}" has been accepted and onboarded by ${resolveActorLabel(updated.approvedBy, { includeTitle: true })}.`,
      href: portalLink,
      projectId,
      email: emailContent,
    })

    return this.serializeProjectWithCover(updated)
  }

  async updateProject(
    admin: AuthenticatedAgencyUser,
    projectId: string,
    dto: UpdateProjectInput,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can update project settings')
    }
    await this.getProjectById(projectId)

    const data: Prisma.ClientProjectUpdateInput = {
      ...(dto.phase !== undefined ? { phase: dto.phase } : {}),
    }

    if (dto.status !== undefined) {
      data.status = dto.status
      if (dto.status === ClientProjectStatus.COMPLETED) {
        data.completedAt = new Date()
        data.completedBy = { connect: { id: admin.id } }
      }
    }

    const updated = await this.prisma.clientProject.update({
      where: { id: projectId },
      data,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: userActorSelect },
        approvedBy: { select: userActorSelect },
        completedBy: { select: userActorSelect },
      },
    })

    const action =
      dto.status === ClientProjectStatus.COMPLETED
        ? 'project.completed'
        : 'project.updated'

    await this.logActivity(projectId, admin.id, action, {
      status: dto.status,
      phase: dto.phase,
      adminEmail: admin.email,
    })

    if (dto.status === ClientProjectStatus.COMPLETED) {
      const portalLink = this.notifications.clientProjectLink(projectId)
      await this.notifications.notifyOrgClients({
        organizationId: updated.organizationId,
        type: PortalNotificationType.REQUEST_RESOLVED,
        title: `Project completed: ${updated.title}`,
        body: `${admin.email} marked "${updated.title}" as complete.`,
        href: portalLink,
        projectId,
        email: {
          subject: `Project completed: ${updated.title}`,
          html: `<p>${admin.email} marked your project <strong>${updated.title}</strong> as complete.</p><p><a href="${portalLink}">View in portal</a></p>`,
          text: `Project completed by ${admin.email}. View: ${portalLink}`,
          actionLink: portalLink,
        },
      })
    }

    return this.serializeProjectWithCover(updated)
  }

  async createReviewRequest(
    admin: AuthenticatedAdmin,
    projectId: string,
    dto: CreateCheckpointInput,
  ) {
    return this.sendProgressCheckpoint(admin, projectId, dto)
  }

  async sendProgressCheckpoint(
    admin: AuthenticatedAgencyUser,
    projectId: string,
    dto: CreateCheckpointInput,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can send progress checkpoints')
    }
    const project = await this.getProjectById(projectId)
    if (project.status !== ClientProjectStatus.ACTIVE) {
      throw new BadRequestException('Checkpoints require an active project')
    }

    const progress = await this.ensureProgressThread(projectId, admin.id)
    await this.supersedePendingCheckpoints(progress.id)

    let body = dto.body.trim()
    const title = dto.title.trim()
    const reviewUrl = dto.reviewUrl?.trim()
    if (reviewUrl) {
      body = `${body}\n\nReview link: ${reviewUrl}`
    }

    const attachments = dto.attachments ?? []
    for (const attachment of attachments) {
      this.storage.assertPathBelongsToProject(
        attachment.storagePath,
        project.organizationId,
        project.id,
      )
    }

    const message = await this.prisma.$transaction(async (tx) => {
      await tx.projectRequest.update({
        where: { id: progress.id },
        data: { title, description: body, status: ProjectRequestStatus.IN_PROGRESS },
      })

      const checkpointMessage = await tx.projectRequestMessage.create({
        data: {
          requestId: progress.id,
          authorUserId: admin.id,
          authorRole: ProjectMessageAuthorRole.ADMIN,
          body,
          messageKind: ProjectMessageKind.CHECKPOINT,
          checkpointTargetPhase: dto.targetPhase ?? null,
          requiresClientApproval: true,
        },
        include: { author: { select: userActorSelect } },
      })

      const createdAttachmentIds: string[] = []
      for (const attachment of attachments) {
        const created = await tx.projectAttachment.create({
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
        createdAttachmentIds.push(created.id)
      }

      if (createdAttachmentIds.length > 0) {
        await tx.projectRequestMessageAttachment.createMany({
          data: createdAttachmentIds.map((attachmentId) => ({
            messageId: checkpointMessage.id,
            attachmentId,
          })),
          skipDuplicates: true,
        })
      }

      return checkpointMessage
    })

    await this.logActivity(projectId, admin.id, 'checkpoint.sent', {
      requestId: progress.id,
      messageId: message.id,
    })

    if (attachments.length > 0) {
      await this.logActivity(projectId, admin.id, 'attachment.uploaded', {
        requestId: progress.id,
        count: attachments.length,
      })
    }

    const portalLink = `${this.notifications.clientPortalUrl()}/?ccView=approvals&requestId=${progress.id}`
    await this.notifications.notifyOrgClients({
      organizationId: project.organizationId,
      type: PortalNotificationType.CHECKPOINT_PENDING,
      title: `Approval needed: ${title}`,
      body: body.slice(0, 200),
      href: portalLink,
      projectId,
      requestId: progress.id,
      email: {
        subject: `Approval needed: ${title}`,
        html: `<p>CoCreate requested your approval on <strong>${project.title}</strong>:</p><blockquote>${body.slice(0, 400)}</blockquote><p><a href="${portalLink}">Review in portal</a></p>`,
        text: `Approval needed: ${title}\n${body}\n${portalLink}`,
        actionLink: portalLink,
      },
    })

    const full = await this.prisma.projectRequest.findUnique({
      where: { id: progress.id },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    await this.notifyThreadUpdate(progress.id, 'checkpoint', message.id)
    return serializeRequest(full!)
  }

  async resolveCancellation(
    admin: AuthenticatedAgencyUser,
    requestId: string,
    dto: ResolveCancellationInput,
  ) {
    if (!this.agencyAccess.isCoreTeam(admin)) {
      throw new ForbiddenException('Only core team can resolve cancellations')
    }
    const request = await this.getRequestForActor(requestId, admin)
    if (request.type !== ProjectRequestType.CANCELLATION) {
      throw new BadRequestException('Not a cancellation request')
    }

    const terminal: ProjectRequestStatus[] = [
      ProjectRequestStatus.RESOLVED,
      ProjectRequestStatus.REJECTED,
      ProjectRequestStatus.CANCELLED,
    ]
    if (terminal.includes(request.status)) {
      throw new BadRequestException('Cancellation request is already closed')
    }

    const now = new Date()
    const cancelProject =
      dto.outcome === CancellationOutcome.APPROVED_NO_FEE ||
      dto.outcome === CancellationOutcome.APPROVED_WITH_FEE

    await this.prisma.$transaction(async (tx) => {
      if (dto.message?.trim()) {
        await tx.projectRequestMessage.create({
          data: {
            requestId,
            authorUserId: admin.id,
            authorRole: ProjectMessageAuthorRole.ADMIN,
            body: dto.message.trim(),
            messageKind: ProjectMessageKind.CHAT,
          },
        })
      }

      await tx.projectRequest.update({
        where: { id: requestId },
        data: {
          status: ProjectRequestStatus.RESOLVED,
          resolvedAt: now,
          resolvedByUserId: admin.id,
          cancellationOutcome: dto.outcome,
          cancellationFeeAmount:
            dto.outcome === CancellationOutcome.APPROVED_WITH_FEE && dto.feeAmount != null
              ? dto.feeAmount
              : null,
          cancellationFeeNotes: dto.feeNotes?.trim() || null,
        },
      })

      if (cancelProject) {
        await tx.clientProject.update({
          where: { id: request.projectId },
          data: { status: ClientProjectStatus.CANCELLED },
        })
      }
    })

    const portalLink = this.notifications.clientProjectLink(request.projectId)
    await this.notifications.notifyOrgClients({
      organizationId: request.project.organizationId,
      type: PortalNotificationType.CANCELLATION_RESOLVED,
      title: `Cancellation update: ${request.project.title}`,
      body: dto.message?.trim() || `Outcome: ${dto.outcome}`,
      href: portalLink,
      projectId: request.projectId,
      requestId,
    })

    const updated = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    await this.notifyThreadUpdate(requestId, 'status')
    return serializeRequest(updated!)
  }

  async addRequestMessage(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    requestId: string,
    dto: CreateRequestMessageInput,
  ) {
    const request = await this.getRequestForActor(requestId, actor)
    const terminal: ProjectRequestStatus[] = [
      ProjectRequestStatus.RESOLVED,
      ProjectRequestStatus.REJECTED,
      ProjectRequestStatus.CANCELLED,
    ]
    if (terminal.includes(request.status)) {
      throw new BadRequestException('This conversation is closed')
    }

    const isClient = 'organization' in actor && Boolean(actor.organization)
    if (!isClient) {
      await this.agencyAccess.assertCanPostToRequest(actor, request.type)
    }

    const authorRole = isClient
      ? ProjectMessageAuthorRole.CLIENT
      : isCollaboratorRole(actor.role)
        ? ProjectMessageAuthorRole.COLLABORATOR
        : ProjectMessageAuthorRole.ADMIN

    const message = await this.prisma.projectRequestMessage.create({
      data: {
        requestId,
        authorUserId: actor.id,
        authorRole,
        body: dto.body.trim(),
      },
      include: {
        author: { select: userActorSelect },
        attachmentLinks: { include: { attachment: true } },
      },
    })

    await this.linkAttachmentsToMessage(
      message.id,
      request.projectId,
      dto.attachmentIds,
      request.type,
    )

    const messageWithAttachments =
      dto.attachmentIds?.length
        ? await this.prisma.projectRequestMessage.findUnique({
            where: { id: message.id },
            include: {
              author: { select: userActorSelect },
              attachmentLinks: { include: { attachment: true } },
            },
          })
        : message

    if (request.status === ProjectRequestStatus.OPEN) {
      await this.prisma.projectRequest.update({
        where: { id: requestId },
        data: { status: ProjectRequestStatus.IN_PROGRESS },
      })
    }

    await this.logActivity(request.projectId, actor.id, 'request.message', {
      requestId,
      messageId: message.id,
    })

    const adminLink = `${this.notifications.adminClientWorkspaceLink(request.project.organizationId)}?tab=projects&thread=${requestId}`
    const clientLink =
      request.type === ProjectRequestType.PROGRESS
        ? `${this.notifications.clientPortalUrl()}/?ccView=projects&projectId=${request.projectId}`
        : `${this.notifications.clientPortalUrl()}/?ccView=approvals&requestId=${requestId}`
    const snippet = dto.body.trim().slice(0, 200)

    if (isClient) {
      await this.notifications.notifyAdmins({
        organizationId: request.project.organizationId,
        type: PortalNotificationType.REQUEST_MESSAGE,
        title: `Client replied: ${request.title}`,
        body: snippet,
        href: adminLink,
        projectId: request.projectId,
        requestId,
        email: {
          subject: `Client reply on ${request.project.title}`,
          html: `<p>${request.project.organization?.name ?? 'Client'} replied on <strong>${request.title}</strong>:</p><blockquote>${snippet}</blockquote><p><a href="${adminLink}">View conversation</a></p>`,
          text: `Client replied: ${snippet}\n\nView: ${adminLink}`,
          actionLink: adminLink,
        },
      })
    } else if (request.type !== ProjectRequestType.INTERNAL) {
      await this.notifications.notifyOrgClients({
        organizationId: request.project.organizationId,
        type: PortalNotificationType.REQUEST_MESSAGE,
        title: `CoCreate replied: ${request.title}`,
        body: snippet,
        href: clientLink,
        projectId: request.projectId,
        requestId,
        email: {
          subject: `New message on ${request.project.title}`,
          html: `<p>CoCreate sent a follow-up on <strong>${request.title}</strong>:</p><blockquote>${snippet}</blockquote><p><a href="${clientLink}">Reply in portal</a></p>`,
          text: `CoCreate: ${snippet}\n\nReply: ${clientLink}`,
          actionLink: clientLink,
        },
      })
      await this.notifications.markInboxReadForRequest(
        actor.id,
        request.project.organizationId,
        requestId,
      )
    }

    if (dto.attachmentIds?.length) {
      await this.notifyThreadUpdate(requestId, 'attachment')
    }
    await this.notifyThreadUpdate(requestId, 'message', message.id)
    return serializeMessage(messageWithAttachments ?? message)
  }

  async updateRequest(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    requestId: string,
    dto: UpdateRequestInput,
  ) {
    const request = await this.getRequestForActor(requestId, actor)
    if (!('organization' in actor) || !actor.organization) {
      if (!this.agencyAccess.isCoreTeam(actor)) {
        throw new ForbiddenException('Only core team can update request status')
      }
    }

    const terminal: ProjectRequestStatus[] = [
      ProjectRequestStatus.RESOLVED,
      ProjectRequestStatus.REJECTED,
      ProjectRequestStatus.CANCELLED,
    ]
    if (!terminal.includes(dto.status) && terminal.includes(request.status)) {
      throw new BadRequestException('Request is already closed')
    }

    const isClosing = terminal.includes(dto.status)

    const updated = await this.prisma.projectRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        resolvedAt: isClosing ? new Date() : null,
        resolvedByUserId: isClosing ? actor.id : null,
      },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })

    await this.logActivity(request.projectId, actor.id, 'request.updated', {
      requestId,
      status: dto.status,
    })

    const portalLink = this.notifications.clientProjectLink(request.projectId)

    if ('organization' in actor && actor.organization) {
      // client resolved — notify admins
      await this.notifications.notifyAdmins({
        organizationId: request.project.organizationId,
        type: PortalNotificationType.REQUEST_RESOLVED,
        title: `Request updated: ${request.title}`,
        body: `Client updated request status to ${dto.status}.`,
        href: `${this.notifications.adminClientWorkspaceLink(request.project.organizationId)}?tab=inbox`,
        projectId: request.projectId,
        requestId,
      })
    } else {
      const emailContent = this.mail.buildRequestResolvedEmail({
        projectTitle: request.project.title,
        requestTitle: request.title,
        portalLink,
      })
      await this.notifications.notifyOrgClients({
        organizationId: request.project.organizationId,
        type: PortalNotificationType.REQUEST_RESOLVED,
        title: `Request updated: ${request.title}`,
        body: `Your request status is now ${dto.status}.`,
        href: portalLink,
        projectId: request.projectId,
        requestId,
        email: emailContent,
      })
    }

    await this.notifyThreadUpdate(requestId, 'status')
    return serializeRequest(updated)
  }

  // ─── Attachments ────────────────────────────────────────────────────────────

  async createUploadUrlForClient(
    client: AuthenticatedClient,
    projectId: string,
    dto: UploadUrlInput,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    return this.storage.createUploadUrl({
      organizationId: project.organizationId,
      projectId: project.id,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async createUploadUrlForAdmin(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    dto: UploadUrlInput,
  ) {
    await this.agencyAccess.assertCanAccessProject(actor, projectId)
    const project = await this.getProjectById(projectId)
    return this.storage.createUploadUrl({
      organizationId: project.organizationId,
      projectId: project.id,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async registerAttachmentForClient(
    client: AuthenticatedClient,
    projectId: string,
    dto: RegisterAttachmentInput,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    this.storage.assertPathBelongsToProject(
      dto.storagePath,
      project.organizationId,
      project.id,
    )

    if (dto.requestId) {
      const req = await this.prisma.projectRequest.findFirst({
        where: { id: dto.requestId, projectId: project.id },
      })
      if (!req) throw new NotFoundException('Request not found')
    }

    const row = await this.prisma.projectAttachment.create({
      data: {
        projectId: project.id,
        requestId: dto.requestId ?? null,
        storagePath: dto.storagePath,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        visibility: ProjectAttachmentVisibility.CLIENT,
        uploadedByUserId: client.id,
      },
    })

    await this.logActivity(project.id, client.id, 'attachment.uploaded', {
      fileName: dto.fileName,
    })

    if (dto.requestId) {
      await this.notifyThreadUpdate(dto.requestId, 'attachment')
    }

    return serializeAttachment(row)
  }

  async registerAttachmentForAdmin(
    admin: AuthenticatedAgencyUser,
    projectId: string,
    dto: RegisterAttachmentInput,
  ) {
    await this.agencyAccess.assertCanAccessProject(admin, projectId)
    const project = await this.getProjectById(projectId)
    this.storage.assertPathBelongsToProject(
      dto.storagePath,
      project.organizationId,
      project.id,
    )

    const isCollaborator = !this.agencyAccess.isCoreTeam(admin)
    let visibility =
      dto.visibility ?? ProjectAttachmentVisibility.CLIENT

    if (dto.requestId) {
      const req = await this.prisma.projectRequest.findFirst({
        where: { id: dto.requestId, projectId: project.id },
      })
      if (!req) throw new NotFoundException('Request not found')
      if (isCollaborator && req.type !== ProjectRequestType.INTERNAL) {
        throw new ForbiddenException(
          'Collaborators can only attach files to the team review thread',
        )
      }
      if (req.type === ProjectRequestType.INTERNAL) {
        visibility = ProjectAttachmentVisibility.INTERNAL
      }
    }

    if (isCollaborator) {
      visibility = ProjectAttachmentVisibility.INTERNAL
    }

    const row = await this.prisma.projectAttachment.create({
      data: {
        projectId: project.id,
        requestId: dto.requestId ?? null,
        storagePath: dto.storagePath,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        visibility,
        uploadedByUserId: admin.id,
      },
    })

    await this.logActivity(project.id, admin.id, 'attachment.uploaded', {
      fileName: dto.fileName,
    })

    if (dto.requestId) {
      await this.notifyThreadUpdate(dto.requestId, 'attachment')
    }

    return serializeAttachment(row)
  }

  async listFilesLibraryForClient(
    client: AuthenticatedClient,
    options?: { projectId?: string; q?: string; cursor?: string; limit?: number },
  ) {
    const accessibleProjects = this.clientAccess.accessibleProjectsWhere(client)

    const projects = await this.prisma.clientProject.findMany({
      where: accessibleProjects,
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
    })
    return this.listFilesForProjects(projects, {
      ...options,
      visibility: ProjectAttachmentVisibility.CLIENT,
    })
  }

  async listFilesForProjectClient(
    client: AuthenticatedClient,
    projectId: string,
    options?: { q?: string; cursor?: string; limit?: number },
  ) {
    const project = await this.getProjectForClient(client, projectId)
    return this.listFilesForProjects(
      [{ id: project.id, title: project.title }],
      {
        ...options,
        projectId: project.id,
        visibility: ProjectAttachmentVisibility.CLIENT,
      },
    )
  }

  async listFilesLibraryForAdmin(
    actor: AuthenticatedAgencyUser,
    organizationId: string,
    options?: {
      projectId?: string
      q?: string
      cursor?: string
      limit?: number
      visibility?: ProjectAttachmentVisibility
    },
  ) {
    if (!this.agencyAccess.isCoreTeam(actor)) {
      throw new ForbiddenException('Organization files require core team access')
    }
    const projects = await this.prisma.clientProject.findMany({
      where: { organizationId },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
    })
    return this.listFilesForProjects(projects, options)
  }

  async listFilesForProjectAdmin(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    options?: {
      q?: string
      cursor?: string
      limit?: number
      visibility?: ProjectAttachmentVisibility
    },
  ) {
    await this.agencyAccess.assertCanAccessProject(actor, projectId)
    const project = await this.getProjectById(projectId)
    return this.listFilesForProjects(
      [{ id: project.id, title: project.title }],
      { ...options, projectId: project.id },
    )
  }

  async getAttachmentDownloadUrl(
    actor: AuthenticatedClient | AuthenticatedAgencyUser,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: { project: true },
    })
    if (!attachment) throw new NotFoundException('Attachment not found')

    if ('organization' in actor && actor.organization) {
      if (attachment.visibility === ProjectAttachmentVisibility.INTERNAL) {
        throw new NotFoundException('Attachment not found')
      }
      await this.clientAccess.assertProjectAccess(
        actor,
        attachment.projectId,
        'VIEW',
      )
    } else {
      await this.agencyAccess.assertCanAccessProject(actor, attachment.projectId)
    }

    const signed = await this.storage.createDownloadUrl(attachment.storagePath)
    return { ...serializeAttachment(attachment), download: signed }
  }

  // ─── Project cover ──────────────────────────────────────────────────────────

  async createCoverUploadUrlForClient(
    client: AuthenticatedClient,
    projectId: string,
    dto: UploadUrlInput,
  ) {
    const project = await this.getProjectForClient(client, projectId, 'MANAGE')
    return this.storage.createCoverUploadUrl({
      organizationId: project.organizationId,
      projectId: project.id,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async registerCoverForClient(
    client: AuthenticatedClient,
    projectId: string,
    dto: RegisterCoverInput,
  ) {
    const project = await this.getProjectForClient(client, projectId, 'MANAGE')
    this.storage.assertCoverPathBelongsToProject(
      dto.storagePath,
      project.organizationId,
      project.id,
    )

    const previousPath = project.coverStoragePath

    const updated = await this.prisma.clientProject.update({
      where: { id: project.id },
      data: { coverStoragePath: dto.storagePath },
      include: this.projectDetailInclude(),
    })

    if (previousPath && previousPath !== dto.storagePath) {
      await this.storage.deleteObject(previousPath)
    }

    await this.logActivity(project.id, client.id, 'cover.updated', {})

    return this.serializeProjectWithCover(updated)
  }

  async removeCoverForClient(client: AuthenticatedClient, projectId: string) {
    const project = await this.getProjectForClient(client, projectId, 'MANAGE')

    if (!project.coverStoragePath) {
      const current = await this.prisma.clientProject.findUnique({
        where: { id: project.id },
        include: this.projectDetailInclude(),
      })
      return this.serializeProjectWithCover(current!)
    }

    const previousPath = project.coverStoragePath

    const updated = await this.prisma.clientProject.update({
      where: { id: project.id },
      data: { coverStoragePath: null },
      include: this.projectDetailInclude(),
    })

    await this.storage.deleteObject(previousPath)
    await this.logActivity(project.id, client.id, 'cover.updated', { removed: true })

    return this.serializeProjectWithCover(updated)
  }

  // ─── Notifications (client) ───────────────────────────────────────────────

  listNotificationsForClient(client: AuthenticatedClient, unreadOnly?: boolean) {
    return this.notifications.listForUser(client.id, unreadOnly)
  }

  markNotificationRead(client: AuthenticatedClient, notificationId: string) {
    return this.notifications.markRead(client.id, notificationId)
  }

  unreadNotificationCount(client: AuthenticatedClient) {
    return this.notifications.unreadCount(client.id)
  }

  async unreadApprovalsCountForClient(client: AuthenticatedClient) {
    this.clientAccess.requireOrganizationId(client)
    const count = await this.notifications.unreadCheckpointApprovalsCountForClient(
      client.id,
      this.clientAccess.accessibleProjectsWhere(client),
    )
    return { count }
  }

  async markApprovalsReadForClient(client: AuthenticatedClient, requestId?: string) {
    this.clientAccess.requireOrganizationId(client)
    if (requestId) {
      const request = await this.prisma.projectRequest.findUnique({
        where: { id: requestId },
        select: { projectId: true },
      })
      if (request) {
        await this.clientAccess.assertProjectAccess(client, request.projectId, 'VIEW')
      }
    }
    return this.notifications.markCheckpointApprovalsReadForClient(
      client.id,
      this.clientAccess.accessibleProjectsWhere(client),
      requestId,
    )
  }

  async unreadAttentionCountForClient(client: AuthenticatedClient) {
    this.clientAccess.requireOrganizationId(client)
    const count = await this.notifications.unreadAttentionCountForClient(
      client.id,
      this.clientAccess.accessibleProjectsWhere(client),
    )
    return { count }
  }

  async listAttentionForClient(client: AuthenticatedClient) {
    this.clientAccess.requireOrganizationId(client)
    return this.notifications.listAttentionForClient(
      client.id,
      this.clientAccess.accessibleProjectsWhere(client),
    )
  }

  async markAttentionReadForClient(
    client: AuthenticatedClient,
    params: { requestId?: string; projectId?: string },
  ) {
    this.clientAccess.requireOrganizationId(client)

    if (params.requestId) {
      const request = await this.prisma.projectRequest.findUnique({
        where: { id: params.requestId },
        select: { projectId: true },
      })
      if (!request) return { count: 0 }
      await this.clientAccess.assertProjectAccess(client, request.projectId, 'VIEW')
      return this.notifications.markRequestNotificationsReadForClient(
        client.id,
        this.clientAccess.requireOrganizationId(client),
        this.clientAccess.accessibleProjectsWhere(client),
        params.requestId,
      )
    }
    if (params.projectId) {
      await this.clientAccess.assertProjectAccess(client, params.projectId, 'VIEW')
      return this.notifications.markProjectNotificationsReadForClient(
        client.id,
        this.clientAccess.accessibleProjectsWhere(client),
        params.projectId,
      )
    }
    return { count: 0 }
  }
}
