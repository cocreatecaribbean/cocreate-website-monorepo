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
  ProjectAttachment,
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
import { ThreadSummaryStoreService } from '../messaging-summary/thread-summary-store.service'
import { AgencyAccessService } from '../auth/agency-access.service'
import { isCollaboratorRole } from '../auth/admin-roles'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { MessagingEmitService } from '../messaging/messaging-emit.service'
import { ProjectStorageService } from './project-storage.service'
import type { ClientRecentActivityItem } from '@cocreate/api-contracts/v1/client-portal'
import type {
  CreateCancellationRequestInput,
  CreateChangeRequestInput,
  CreatePhaseApprovalInput,
  CreateProjectInput,
  CreateProjectForAdminInput,
  ResolveCancellationInput,
  RegisterAttachmentInput,
  RenameProjectInput,
  UpdateProjectInput,
  CreateRequestMessageInput,
  UploadUrlInput,
  RegisterCoverInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { ClientTeamService } from './client-team.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import {
  serializeActivity,
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
    private readonly messaging: MessagingEmitService,
    private readonly clientTeam: ClientTeamService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly threadSummaryStore: ThreadSummaryStoreService,
  ) {}

  private portalCallbackUrl() {
    const portalBase = process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
    return `${portalBase}/auth/callback`
  }

  private async notifyThreadUpdate(
    requestId: string,
    reason: 'message' | 'status' | 'attachment',
    extra?: { messageId?: string; message?: ReturnType<typeof serializeMessage> },
  ): Promise<void> {
    if (reason === 'message' && extra?.message) {
      this.messaging.emitThreadMessage(requestId, extra.message as Record<string, unknown>)
      return
    }
    if (reason === 'attachment') {
      this.messaging.emitThreadAttachment(requestId)
      return
    }
    if (reason === 'status') {
      this.messaging.emitThreadStatus(requestId)
    }
  }

  async assertThreadAccess(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    requestId: string,
  ): Promise<void> {
    await this.getRequestForActor(requestId, actor)
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

  /**
   * Updates ClientProject.title and keeps the ONBOARDING thread title in sync.
   * Progress / internal thread titles are intentionally left alone.
   */
  private async renameProjectTitle(
    projectId: string,
    title: string,
    actorUserId: string,
  ): Promise<{ title: string; changed: boolean; previousTitle: string }> {
    const newTitle = title.trim()
    const existing = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: { title: true },
    })
    if (!existing) throw new NotFoundException('Project not found')
    if (existing.title === newTitle) {
      return { title: newTitle, changed: false, previousTitle: existing.title }
    }

    await this.prisma.clientProject.update({
      where: { id: projectId },
      data: { title: newTitle },
    })
    await this.prisma.projectRequest.updateMany({
      where: { projectId, type: ProjectRequestType.ONBOARDING },
      data: { title: newTitle },
    })
    await this.logActivity(projectId, actorUserId, 'project.renamed', {
      previousTitle: existing.title,
      title: newTitle,
    })
    return { title: newTitle, changed: true, previousTitle: existing.title }
  }

  private projectDetailInclude() {
    return {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: userActorSelect },
      approvedBy: { select: userActorSelect },
      completedBy: { select: userActorSelect },
    } as const
  }

  private requestListInclude() {
    return {
      createdBy: { select: userActorSelect },
      resolvedBy: { select: userActorSelect },
      attachments: true,
    }
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
        },
      },
    }
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
        description: 'Collaboration and progress updates',
        createdByUserId,
        status: ProjectRequestStatus.OPEN,
      },
      update: {
        title: 'Project progress',
        description: 'Collaboration and progress updates',
      },
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
      update: {
        title: 'Team review',
        description: 'Internal CoCreate discussion — not visible to the client.',
      },
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

  /** Lightweight request fetch for message POST — avoids loading full message history. */
  private async getRequestContextForActor(
    requestId: string,
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
  ) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        projectId: true,
        type: true,
        status: true,
        title: true,
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

  async listForClient(
    client: AuthenticatedClient,
    options?: { cursor?: string; limit?: number },
  ) {
    const limit = Math.min(100, Math.max(1, options?.limit ?? 100))
    const projects = await this.prisma.clientProject.findMany({
      where: this.clientAccess.accessibleProjectsWhere(client),
      orderBy: { updatedAt: 'desc' },
      include: this.projectListInclude(),
      take: limit + 1,
      ...(options?.cursor
        ? {
            cursor: { id: options.cursor },
            skip: 1,
          }
        : {}),
    })
    const hasMore = projects.length > limit
    const page = hasMore ? projects.slice(0, limit) : projects
    return {
      projects: this.serializeProjectsForList(page),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    }
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
        ownerUserId: client.id,
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
      include: this.projectListInclude(),
    })
    return this.serializeProjectsForList(projects)
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
        ...this.requestListInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    return requests.map((r) => serializeRequest(r, { omitStoragePath: true }))
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

  async listRequestMessages(
    actor: AuthenticatedAgencyUser | AuthenticatedClient,
    requestId: string,
    options?: { cursor?: string; limit?: number },
  ) {
    await this.getRequestForActor(requestId, actor)
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50))
    const cursorMessage = options?.cursor
      ? await this.prisma.projectRequestMessage.findUnique({
          where: { id: options.cursor },
          select: { createdAt: true, requestId: true },
        })
      : null
    if (options?.cursor && (!cursorMessage || cursorMessage.requestId !== requestId)) {
      throw new BadRequestException('Invalid message cursor')
    }

    const rows = await this.prisma.projectRequestMessage.findMany({
      where: {
        requestId,
        ...(cursorMessage ? { createdAt: { lt: cursorMessage.createdAt } } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: {
        author: { select: userActorSelect },
        attachmentLinks: { include: { attachment: true } },
      },
    })

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows
    const messages = [...pageRows].reverse().map((message) => serializeMessage(message))

    return {
      messages,
      nextCursor: hasMore ? pageRows[pageRows.length - 1]!.id : null,
    }
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
      (u) => u.status === UserStatus.INVITED && u.clientOrgRole === ClientOrgRole.ADMIN,
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

    // Owner must be a client Admin. Prefer the first selected recipient, else
    // fall back to the creating agency user until an invited client is resolved.
    const initialOwnerUserId = recipientUsers[0]?.id ?? admin.id

    const project = await this.prisma.clientProject.create({
      data: {
        organizationId,
        title,
        description,
        status: ClientProjectStatus.ACTIVE,
        phase: ClientProjectPhase.DISCOVERY,
        createdByUserId: admin.id,
        ownerUserId: initialOwnerUserId,
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

    let firstInvitedUserId: string | null = null
    for (const email of inviteEmails) {
      const invited = await this.clientTeam.inviteToOrganizationAsAdmin(
        admin,
        organizationId,
        {
          email,
          clientOrgRole: ClientOrgRole.ADMIN,
        },
        projectInviteCopy,
      )
      firstInvitedUserId ??= invited.member.id
      portalActions.newInvitesSent += 1
      portalActions.invitedEmails.push(email)
    }

    // Ensure the project owner is a client Admin. If a recipient was chosen,
    // promote them; otherwise hand ownership to the first invited client Admin.
    if (recipientUsers[0]) {
      await this.prisma.clientOrganizationMembership.updateMany({
        where: {
          userId: recipientUsers[0].id,
          organizationId,
        },
        data: { clientOrgRole: ClientOrgRole.ADMIN },
      })
      await this.prisma.user.update({
        where: { id: recipientUsers[0].id },
        data: { clientOrgRole: ClientOrgRole.ADMIN },
      })
    } else if (firstInvitedUserId) {
      await this.prisma.clientProject.update({
        where: { id: project.id },
        data: { ownerUserId: firstInvitedUserId },
      })
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

    if (dto.title !== undefined) {
      await this.renameProjectTitle(projectId, dto.title, admin.id)
    }

    const hasStatusOrPhase =
      dto.status !== undefined || dto.phase !== undefined

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

    const updated = hasStatusOrPhase
      ? await this.prisma.clientProject.update({
          where: { id: projectId },
          data,
          include: this.projectDetailInclude(),
        })
      : await this.prisma.clientProject.findUniqueOrThrow({
          where: { id: projectId },
          include: this.projectDetailInclude(),
        })

    if (hasStatusOrPhase) {
      const action =
        dto.status === ClientProjectStatus.COMPLETED
          ? 'project.completed'
          : 'project.updated'

      await this.logActivity(projectId, admin.id, action, {
        status: dto.status,
        phase: dto.phase,
        adminEmail: admin.email,
      })
    }

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

  async renameForClient(
    client: AuthenticatedClient,
    projectId: string,
    dto: RenameProjectInput,
  ) {
    await this.clientAccess.assertCanCreateProject(client)
    await this.getProjectForClient(client, projectId, 'VIEW')
    await this.renameProjectTitle(projectId, dto.title, client.id)

    const updated = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      include: this.projectDetailInclude(),
    })
    return this.serializeProjectWithCover(updated)
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
    const request = await this.getRequestContextForActor(requestId, actor)
    const terminal: ProjectRequestStatus[] = [
      ProjectRequestStatus.RESOLVED,
      ProjectRequestStatus.REJECTED,
      ProjectRequestStatus.CANCELLED,
    ]
    if (terminal.includes(request.status)) {
      throw new BadRequestException('This conversation is closed')
    }

    const isClient = 'organization' in actor && Boolean(actor.organization)
    if (isClient) {
      await this.clientAccess.assertCanSendProjectMessage(
        actor as AuthenticatedClient,
        request.projectId,
      )
    } else {
      await this.agencyAccess.assertCanPostToRequest(actor, request.type)
    }

    const authorRole = isClient
      ? ProjectMessageAuthorRole.CLIENT
      : isCollaboratorRole(actor.role)
        ? ProjectMessageAuthorRole.COLLABORATOR
        : ProjectMessageAuthorRole.ADMIN

    const body = dto.body.trim()
    const attachmentIds = dto.attachmentIds ?? []
    if (!body && attachmentIds.length === 0) {
      throw new BadRequestException(
        'Message must include text or at least one attachment',
      )
    }

    const message = await this.prisma.projectRequestMessage.create({
      data: {
        requestId,
        authorUserId: actor.id,
        authorRole,
        body,
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

    const serialized = serializeMessage(messageWithAttachments ?? message)

    await this.notifyThreadUpdate(requestId, 'message', {
      messageId: message.id,
      message: serialized,
    })
    void this.threadSummaryStore.invalidate('PROJECT_REQUEST', requestId)
    if (dto.attachmentIds?.length) {
      void this.notifyThreadUpdate(requestId, 'attachment')
    }

    const adminLink = `${this.notifications.adminClientWorkspaceLink(request.project.organizationId)}?tab=projects&thread=${requestId}`
    const clientLink =
      request.type === ProjectRequestType.PROGRESS
        ? `${this.notifications.clientPortalUrl()}/?ccView=projects&projectId=${request.projectId}`
        : `${this.notifications.clientPortalUrl()}/?ccView=projects&projectId=${request.projectId}&requestId=${requestId}`
    const snippet = body.slice(0, 200) || (attachmentIds.length ? 'Sent an attachment' : '')
    const projectTitle = request.project.title

    if (isClient) {
      void this.notifications.notifyAdmins({
        organizationId: request.project.organizationId,
        type: PortalNotificationType.REQUEST_MESSAGE,
        title: `Client replied: ${projectTitle}`,
        body: snippet,
        href: adminLink,
        projectId: request.projectId,
        requestId,
        email: {
          subject: `Client reply on ${projectTitle}`,
          html: `<p>${request.project.organization?.name ?? 'Client'} replied on <strong>${projectTitle}</strong>:</p><blockquote>${snippet}</blockquote><p><a href="${adminLink}">View conversation</a></p>`,
          text: `Client replied on ${projectTitle}: ${snippet}\n\nView: ${adminLink}`,
          actionLink: adminLink,
        },
      })
    } else if (request.type !== ProjectRequestType.INTERNAL) {
      void this.notifications.notifyOrgClients({
        organizationId: request.project.organizationId,
        type: PortalNotificationType.REQUEST_MESSAGE,
        title: `CoCreate replied: ${projectTitle}`,
        body: snippet,
        href: clientLink,
        projectId: request.projectId,
        requestId,
        email: {
          subject: `New message on ${projectTitle}`,
          html: `<p>CoCreate sent a follow-up on <strong>${projectTitle}</strong>:</p><blockquote>${snippet}</blockquote><p><a href="${clientLink}">Reply in portal</a></p>`,
          text: `CoCreate replied on ${projectTitle}: ${snippet}\n\nReply: ${clientLink}`,
          actionLink: clientLink,
        },
      })
      void this.notifications.markInboxReadForRequest(
        actor.id,
        request.project.organizationId,
        requestId,
      )
    }

    return serialized
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

  async downloadAttachmentBytes(
    actor: AuthenticatedClient | AuthenticatedAgencyUser,
    attachmentId: string,
  ): Promise<Buffer | null> {
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: { project: true },
    })
    if (!attachment) return null

    if ('organization' in actor && actor.organization) {
      if (attachment.visibility === ProjectAttachmentVisibility.INTERNAL) {
        return null
      }
      await this.clientAccess.assertProjectAccess(
        actor,
        attachment.projectId,
        'VIEW',
      )
    } else {
      await this.agencyAccess.assertCanAccessProject(actor, attachment.projectId)
    }

    try {
      return await this.storage.downloadObject(attachment.storagePath)
    } catch {
      return null
    }
  }

  async removeAttachmentFromMessage(
    actor: AuthenticatedClient | AuthenticatedAgencyUser,
    attachmentId: string,
    messageId?: string,
  ) {
    if (messageId?.trim()) {
      return this.removeAttachmentFromSingleMessage(
        actor,
        attachmentId,
        messageId.trim(),
      )
    }
    return this.removeAttachmentFromLibrary(actor, attachmentId)
  }

  private async assertCanRemoveAttachment(
    actor: AuthenticatedClient | AuthenticatedAgencyUser,
    attachment: ProjectAttachment,
  ) {
    const isClient = 'organization' in actor && Boolean(actor.organization)

    if (isClient) {
      if (attachment.visibility === ProjectAttachmentVisibility.INTERNAL) {
        throw new NotFoundException('Attachment not found')
      }
      await this.clientAccess.assertProjectAccess(
        actor,
        attachment.projectId,
        'VIEW',
      )
      if (attachment.uploadedByUserId !== actor.id) {
        throw new ForbiddenException('You can only remove files you uploaded')
      }
    } else if (isCollaboratorRole(actor.role)) {
      await this.agencyAccess.assertCanAccessProject(actor, attachment.projectId)
      if (attachment.uploadedByUserId !== actor.id) {
        throw new ForbiddenException('You can only remove files you uploaded')
      }
    } else {
      await this.agencyAccess.assertCanAccessProject(actor, attachment.projectId)
    }
  }

  private async removeAttachmentFromLibrary(
    actor: AuthenticatedClient | AuthenticatedAgencyUser,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        messageLinks: {
          include: {
            message: { select: { requestId: true } },
          },
        },
      },
    })
    if (!attachment) {
      throw new NotFoundException('Attachment not found')
    }

    await this.assertCanRemoveAttachment(actor, attachment)

    const affectedRequestIds = [
      ...new Set(attachment.messageLinks.map((link) => link.message.requestId)),
    ]

    let storagePathToDelete: string | null = null

    await this.prisma.$transaction(async (tx) => {
      await tx.projectRequestMessageAttachment.deleteMany({
        where: { attachmentId },
      })

      const remainingLinks = await tx.projectRequestMessageAttachment.count({
        where: { attachmentId },
      })

      if (remainingLinks === 0) {
        await tx.projectAttachment.delete({ where: { id: attachmentId } })
        storagePathToDelete = attachment.storagePath
      }
    })

    if (storagePathToDelete) {
      await this.storage.deleteObject(storagePathToDelete)
    }

    await this.logActivity(attachment.projectId, actor.id, 'attachment.removed', {
      attachmentId,
      fileName: attachment.fileName,
      scope: 'library',
    })

    for (const requestId of affectedRequestIds) {
      void this.notifyThreadUpdate(requestId, 'attachment')
    }

    return { ok: true as const }
  }

  private async removeAttachmentFromSingleMessage(
    actor: AuthenticatedClient | AuthenticatedAgencyUser,
    attachmentId: string,
    messageId: string,
  ) {
    const link = await this.prisma.projectRequestMessageAttachment.findUnique({
      where: {
        messageId_attachmentId: { messageId, attachmentId },
      },
      include: {
        message: {
          include: {
            request: {
              include: {
                project: { include: { organization: { select: { id: true, name: true } } } },
              },
            },
          },
        },
        attachment: true,
      },
    })
    if (!link) {
      throw new NotFoundException('Attachment not found on this message')
    }

    const request = link.message.request
    await this.getRequestForActor(request.id, actor)

    const attachment = link.attachment
    const isClient = 'organization' in actor && Boolean(actor.organization)

    await this.assertCanRemoveAttachment(actor, attachment)

    let storagePathToDelete: string | null = null

    await this.prisma.$transaction(async (tx) => {
      await tx.projectRequestMessageAttachment.delete({
        where: { messageId_attachmentId: { messageId, attachmentId } },
      })

      const remainingLinks = await tx.projectRequestMessageAttachment.count({
        where: { attachmentId },
      })

      if (remainingLinks === 0) {
        await tx.projectAttachment.delete({ where: { id: attachmentId } })
        storagePathToDelete = attachment.storagePath
      }
    })

    if (storagePathToDelete) {
      await this.storage.deleteObject(storagePathToDelete)
    }

    await this.logActivity(attachment.projectId, actor.id, 'attachment.removed', {
      requestId: request.id,
      messageId,
      attachmentId,
      fileName: attachment.fileName,
    })

    void this.notifyThreadUpdate(request.id, 'attachment')

    const fullThread = await this.prisma.projectRequest.findUnique({
      where: { id: request.id },
      include: {
        ...this.requestInclude(),
        project: { include: { organization: { select: { id: true, name: true } } } },
      },
    })
    if (!fullThread) {
      throw new NotFoundException('Request not found')
    }

    return {
      ok: true as const,
      thread: serializeRequest(
        { ...fullThread, project: fullThread.project },
        { omitStoragePath: isClient },
      ),
    }
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
