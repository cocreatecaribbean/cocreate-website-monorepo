import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  CancellationOutcome,
  ClientProjectPhase,
  ClientProjectStatus,
  Prisma,
  ProjectMessageAuthorRole,
  ProjectMessageKind,
  ProjectRequestStatus,
  ProjectRequestType,
  PortalNotificationType,
} from '@cocreate/database'
import type { AuthenticatedAdmin, AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'
import type { CreateCheckpointDto } from './dto/create-checkpoint.dto'
import type { CreateCancellationRequestDto } from './dto/create-cancellation-request.dto'
import type { CreateChangeRequestDto } from './dto/create-change-request.dto'
import type { CreatePhaseApprovalDto } from './dto/create-phase-approval.dto'
import type { CreateProjectDto } from './dto/create-project.dto'
import type { ResolveCancellationDto } from './dto/resolve-cancellation.dto'
import type { RegisterAttachmentDto } from './dto/register-attachment.dto'
import type { UpdateProjectDto } from './dto/update-project.dto'
import type { CreateRequestMessageDto } from './dto/create-request-message.dto'
import type { UpdateRequestDto } from './dto/update-request.dto'
import type { UploadUrlDto } from './dto/upload-url.dto'
import {
  serializeActivity,
  serializeApprovalRecord,
  serializeAttachment,
  serializeMessage,
  serializeProject,
  serializeRequest,
} from './projects.serializer'
import { resolveActorLabel, userActorSelect } from '../users/display-name'

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ProjectStorageService,
    private readonly notifications: ProjectNotificationsService,
    private readonly mail: ProjectNotificationMailService,
    private readonly clientAccess: ClientAccessService,
  ) {}

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
        include: { author: { select: userActorSelect } },
      },
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

  private async getRequestForActor(
    requestId: string,
    actor: AuthenticatedAdmin | AuthenticatedClient,
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
      await this.clientAccess.assertProjectAccess(
        actor,
        request.projectId,
        'VIEW',
      )
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
    return projects.map(serializeProject)
  }

  async createForClient(client: AuthenticatedClient, dto: CreateProjectDto) {
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
    return serializeProject(full!)
  }

  async getForClient(client: AuthenticatedClient, projectId: string) {
    await this.clientAccess.assertProjectAccess(client, projectId, 'VIEW')

    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: this.projectDetailInclude(),
    })
    if (!project) throw new NotFoundException('Project not found')

    if (project.status === ClientProjectStatus.ACTIVE) {
      await this.ensureProgressThread(
        projectId,
        project.approvedByUserId ?? project.createdByUserId,
      )
      const refreshed = await this.prisma.clientProject.findUnique({
        where: { id: projectId },
        include: this.projectDetailInclude(),
      })
      return serializeProject(refreshed!)
    }

    return serializeProject(project)
  }

  async createChangeRequest(
    client: AuthenticatedClient,
    projectId: string,
    dto: CreateChangeRequestDto,
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
    dto: CreatePhaseApprovalDto,
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
    dto: CreateCancellationRequestDto,
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

    return serializeMessage(
      (await this.prisma.projectRequestMessage.findUnique({
        where: { id: messageId },
        include: { author: { select: userActorSelect } },
      }))!,
    )
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async listAllForAdmin() {
    const projects = await this.prisma.clientProject.findMany({
      orderBy: { updatedAt: 'desc' },
      include: this.projectListInclude(),
    })
    return projects.map(serializeProject)
  }

  async listForOrganization(organizationId: string) {
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
    return projects.map(serializeProject)
  }

  async getForAdmin(projectId: string) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: this.projectDetailInclude(),
    })
    if (!project) throw new NotFoundException('Project not found')
    return serializeProject(project)
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
    actor: AuthenticatedAdmin | AuthenticatedClient,
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

  async approveProject(admin: AuthenticatedAdmin, organizationId: string, projectId: string) {
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

    return serializeProject(updated)
  }

  async updateProject(admin: AuthenticatedAdmin, projectId: string, dto: UpdateProjectDto) {
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

    return serializeProject(updated)
  }

  async createReviewRequest(
    admin: AuthenticatedAdmin,
    projectId: string,
    dto: CreateCheckpointDto,
  ) {
    return this.sendProgressCheckpoint(admin, projectId, dto)
  }

  async sendProgressCheckpoint(
    admin: AuthenticatedAdmin,
    projectId: string,
    dto: CreateCheckpointDto,
  ) {
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

      for (const attachment of attachments) {
        await tx.projectAttachment.create({
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
    return serializeRequest(full!)
  }

  async resolveCancellation(
    admin: AuthenticatedAdmin,
    requestId: string,
    dto: ResolveCancellationDto,
  ) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
      include: {
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    if (!request) throw new NotFoundException('Request not found')
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
    return serializeRequest(updated!)
  }

  async addRequestMessage(
    actor: AuthenticatedAdmin | AuthenticatedClient,
    requestId: string,
    dto: CreateRequestMessageDto,
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
    const authorRole = isClient
      ? ProjectMessageAuthorRole.CLIENT
      : ProjectMessageAuthorRole.ADMIN

    const message = await this.prisma.projectRequestMessage.create({
      data: {
        requestId,
        authorUserId: actor.id,
        authorRole,
        body: dto.body.trim(),
      },
      include: { author: { select: userActorSelect } },
    })

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
    } else {
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

    return serializeMessage(message)
  }

  async updateRequest(
    actor: AuthenticatedAdmin | AuthenticatedClient,
    requestId: string,
    dto: UpdateRequestDto,
  ) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
      include: {
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })
    if (!request) throw new NotFoundException('Request not found')

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

    return serializeRequest(updated)
  }

  // ─── Attachments ────────────────────────────────────────────────────────────

  async createUploadUrlForClient(
    client: AuthenticatedClient,
    projectId: string,
    dto: UploadUrlDto,
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

  async createUploadUrlForAdmin(projectId: string, dto: UploadUrlDto) {
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
    dto: RegisterAttachmentDto,
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
        uploadedByUserId: client.id,
      },
    })

    await this.logActivity(project.id, client.id, 'attachment.uploaded', {
      fileName: dto.fileName,
    })

    return serializeAttachment(row)
  }

  async registerAttachmentForAdmin(
    admin: AuthenticatedAdmin,
    projectId: string,
    dto: RegisterAttachmentDto,
  ) {
    const project = await this.getProjectById(projectId)
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
        uploadedByUserId: admin.id,
      },
    })

    await this.logActivity(project.id, admin.id, 'attachment.uploaded', {
      fileName: dto.fileName,
    })

    return serializeAttachment(row)
  }

  async getAttachmentDownloadUrl(
    actor: AuthenticatedClient | AuthenticatedAdmin,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: { project: true },
    })
    if (!attachment) throw new NotFoundException('Attachment not found')

    if ('organization' in actor && actor.organization) {
      await this.clientAccess.assertProjectAccess(
        actor,
        attachment.projectId,
        'VIEW',
      )
    }

    const signed = await this.storage.createDownloadUrl(attachment.storagePath)
    return { ...serializeAttachment(attachment), download: signed }
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
