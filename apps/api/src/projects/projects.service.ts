import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientProjectPhase,
  ClientProjectStatus,
  Prisma,
  ProjectMessageAuthorRole,
  ProjectRequestStatus,
  ProjectRequestType,
  PortalNotificationType,
} from '@cocreate/database'
import type { AuthenticatedAdmin, AuthenticatedClient } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'
import type { CreateChangeRequestDto } from './dto/create-change-request.dto'
import type { CreatePhaseApprovalDto } from './dto/create-phase-approval.dto'
import type { CreateProjectDto } from './dto/create-project.dto'
import type { CreateReviewRequestDto } from './dto/create-review-request.dto'
import type { RegisterAttachmentDto } from './dto/register-attachment.dto'
import type { UpdateProjectDto } from './dto/update-project.dto'
import type { CreateRequestMessageDto } from './dto/create-request-message.dto'
import type { UpdateRequestDto } from './dto/update-request.dto'
import type { UploadUrlDto } from './dto/upload-url.dto'
import {
  serializeActivity,
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

  private async getProjectForClient(client: AuthenticatedClient, projectId: string) {
    const orgId = client.organization?.id
    if (!orgId) throw new ForbiddenException('No organization linked to your account')

    const project = await this.prisma.clientProject.findFirst({
      where: { id: projectId, organizationId: orgId },
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
        where: {
          type: ProjectRequestType.ADMIN_REVIEW,
          status: {
            in: [ProjectRequestStatus.OPEN, ProjectRequestStatus.IN_PROGRESS],
          },
        },
        select: { id: true, type: true, status: true },
      },
    }
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
        project: { include: { organization: { select: { id: true, name: true } } } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: userActorSelect } },
        },
      },
    })
    if (!request) throw new NotFoundException('Request not found')

    if ('organization' in actor && actor.organization) {
      if (request.project.organizationId !== actor.organization.id) {
        throw new ForbiddenException('Access denied')
      }
    }

    return request
  }

  // ─── Client projects ────────────────────────────────────────────────────────

  async listForClient(client: AuthenticatedClient) {
    const orgId = client.organization?.id
    if (!orgId) throw new ForbiddenException('No organization linked to your account')

    const projects = await this.prisma.clientProject.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      include: this.projectListInclude(),
    })
    return projects.map(serializeProject)
  }

  async createForClient(client: AuthenticatedClient, dto: CreateProjectDto) {
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

    return serializeProject(project)
  }

  async getForClient(client: AuthenticatedClient, projectId: string) {
    const orgId = client.organization?.id
    if (!orgId) throw new ForbiddenException('No organization linked to your account')

    const project = await this.prisma.clientProject.findFirst({
      where: { id: projectId, organizationId: orgId },
      include: this.projectDetailInclude(),
    })
    if (!project) throw new NotFoundException('Project not found')
    return serializeProject(project)
  }

  async createChangeRequest(
    client: AuthenticatedClient,
    projectId: string,
    dto: CreateChangeRequestDto,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    if (project.status === ClientProjectStatus.SUBMITTED) {
      throw new BadRequestException('Project must be approved before submitting change requests')
    }

    const request = await this.prisma.projectRequest.create({
      data: {
        projectId: project.id,
        type: ProjectRequestType.CHANGE_REQUEST,
        title: dto.title.trim(),
        description: dto.description.trim(),
        createdByUserId: client.id,
      },
      include: {
        createdBy: { select: userActorSelect },
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })

    await this.logActivity(project.id, client.id, 'request.change_created', {
      requestId: request.id,
    })

    const orgName = project.organization?.name ?? 'Client'
    const adminLink = `${this.notifications.adminClientWorkspaceLink(project.organizationId)}?tab=inbox`
    const emailContent = this.mail.buildChangeRequestEmail({
      orgName,
      projectTitle: project.title,
      requestTitle: request.title,
      adminLink,
    })

    await this.notifications.notifyAdmins({
      organizationId: project.organizationId,
      type: PortalNotificationType.CHANGE_REQUEST,
      title: `Change request: ${request.title}`,
      body: `${orgName} requested changes on "${project.title}".`,
      href: adminLink,
      projectId: project.id,
      requestId: request.id,
      email: emailContent,
    })

    return serializeRequest(request)
  }

  async createPhaseApproval(
    client: AuthenticatedClient,
    projectId: string,
    dto: CreatePhaseApprovalDto,
  ) {
    const project = await this.getProjectForClient(client, projectId)
    if (project.status !== ClientProjectStatus.ACTIVE) {
      throw new BadRequestException('Only active projects can request phase approval')
    }

    const title = `Ready for ${dto.targetPhase.replace(/_/g, ' ').toLowerCase()}`
    const description =
      dto.description?.trim() ||
      `Client approved moving "${project.title}" to ${dto.targetPhase}.`

    const request = await this.prisma.projectRequest.create({
      data: {
        projectId: project.id,
        type: ProjectRequestType.PHASE_APPROVAL,
        title,
        description,
        targetPhase: dto.targetPhase,
        createdByUserId: client.id,
      },
      include: {
        createdBy: { select: userActorSelect },
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })

    await this.logActivity(project.id, client.id, 'request.phase_approval', {
      requestId: request.id,
      targetPhase: dto.targetPhase,
    })

    const orgName = project.organization?.name ?? 'Client'
    const adminLink = `${this.notifications.adminClientWorkspaceLink(project.organizationId)}?tab=inbox`
    const emailContent = this.mail.buildPhaseApprovalEmail({
      orgName,
      projectTitle: project.title,
      targetPhase: dto.targetPhase,
      adminLink,
    })

    await this.notifications.notifyAdmins({
      organizationId: project.organizationId,
      type: PortalNotificationType.PHASE_APPROVAL,
      title,
      body: description,
      href: adminLink,
      projectId: project.id,
      requestId: request.id,
      email: emailContent,
    })

    return serializeRequest(request)
  }

  async listOpenRequestsForClient(client: AuthenticatedClient) {
    const orgId = client.organization?.id
    if (!orgId) throw new ForbiddenException('No organization linked to your account')

    const requests = await this.prisma.projectRequest.findMany({
      where: {
        status: { in: [ProjectRequestStatus.OPEN, ProjectRequestStatus.IN_PROGRESS] },
        project: { organizationId: orgId },
        type: ProjectRequestType.ADMIN_REVIEW,
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
          where: { type: ProjectRequestType.ADMIN_REVIEW },
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
    dto: CreateReviewRequestDto,
  ) {
    const project = await this.getProjectById(projectId)

    const body = dto.description.trim()
    const request = await this.prisma.projectRequest.create({
      data: {
        projectId,
        type: ProjectRequestType.ADMIN_REVIEW,
        title: dto.title.trim(),
        description: body,
        createdByUserId: admin.id,
        messages: {
          create: {
            authorUserId: admin.id,
            authorRole: ProjectMessageAuthorRole.ADMIN,
            body,
          },
        },
      },
      include: {
        ...this.requestInclude(),
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })

    await this.logActivity(projectId, admin.id, 'request.admin_review', {
      requestId: request.id,
    })

    const portalLink = this.notifications.clientAttentionLink()
    const emailContent = this.mail.buildAdminReviewEmail({
      projectTitle: project.title,
      requestTitle: request.title,
      portalLink,
    })

    await this.notifications.notifyOrgClients({
      organizationId: project.organizationId,
      type: PortalNotificationType.ADMIN_REVIEW,
      title: `Review needed: ${request.title}`,
      body: dto.description.trim(),
      href: portalLink,
      projectId,
      requestId: request.id,
      email: emailContent,
    })

    return serializeRequest(request)
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
    const clientLink = `${this.notifications.clientPortalUrl()}/?ccView=approvals&requestId=${requestId}`
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
        createdBy: { select: userActorSelect },
        resolvedBy: { select: userActorSelect },
        project: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    })

    if (
      dto.status === ProjectRequestStatus.RESOLVED &&
      request.type === ProjectRequestType.PHASE_APPROVAL &&
      request.targetPhase
    ) {
      await this.prisma.clientProject.update({
        where: { id: request.projectId },
        data: { phase: request.targetPhase },
      })
    }

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
      if (attachment.project.organizationId !== actor.organization.id) {
        throw new ForbiddenException('Access denied')
      }
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
}
