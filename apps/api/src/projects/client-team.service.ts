import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientOrgRole,
  ClientProjectAccessLevel,
  ClientTeamInviteRequestStatus,
  PortalNotificationType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import type { AuthenticatedAdmin, AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import type { InviteTeamMemberDto } from './dto/invite-team-member.dto'
import type { UpdateTeamMemberDto } from './dto/update-team-member.dto'
import type { AddProjectMemberDto } from './dto/add-project-member.dto'
import type { RequestTeamInviteDto } from './dto/request-team-invite.dto'
import type { RejectTeamInviteDto } from './dto/reject-team-invite.dto'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'

export type TeamMemberSummary = {
  id: string
  email: string
  status: UserStatus
  clientOrgRole: ClientOrgRole | null
  canAccessSocialListening: boolean
  createdAt: Date
  updatedAt: Date
}

export type ProjectMemberSummary = {
  id: string
  userId: string
  email: string
  clientOrgRole: ClientOrgRole | null
  access: ClientProjectAccessLevel
  grantedByUserId: string
  createdAt: Date
}

export type AssignableProjectMemberSummary = {
  userId: string
  email: string
  clientOrgRole: ClientOrgRole | null
}

export type TeamHubPermissions = {
  canManageOrgRoles: boolean
  canInviteImmediately: boolean
  canRequestInvite: boolean
  canToggleSocialListening: boolean
}

export type ProjectTeamCard = {
  id: string
  title: string
  status: string
  phase: string
  creatorUserId: string
  creatorEmail: string
  coverImageUrl: string | null
  canManage: boolean
  members: ProjectMemberSummary[]
}

export type TeamInviteRequestSummary = {
  id: string
  email: string
  requestedClientOrgRole: ClientOrgRole
  status: ClientTeamInviteRequestStatus
  requestedByEmail: string
  createdAt: Date
  rejectionReason?: string | null
}

@Injectable()
export class ClientTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly clientAccess: ClientAccessService,
    private readonly notifications: ProjectNotificationsService,
    private readonly storage: ProjectStorageService,
  ) {}

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

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private portalCallbackUrl() {
    const portalBase =
      process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
    return `${portalBase}/auth/callback`
  }

  private mapTeamMember(user: {
    id: string
    email: string
    status: UserStatus
    clientOrgRole: ClientOrgRole | null
    canAccessSocialListening: boolean
    createdAt: Date
    updatedAt: Date
  }): TeamMemberSummary {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      clientOrgRole: user.clientOrgRole,
      canAccessSocialListening: user.canAccessSocialListening,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  private async getOrgTeam(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        role: UserRole.CLIENT,
      },
      orderBy: [{ clientOrgRole: 'asc' }, { createdAt: 'asc' }],
    })
  }

  private teamHubPermissions(client: AuthenticatedClient): TeamHubPermissions {
    return {
      canManageOrgRoles: this.clientAccess.canManageOrgRoles(client),
      canInviteImmediately: this.clientAccess.canInviteOrgMemberImmediately(client),
      canRequestInvite: this.clientAccess.canRequestOrgInvite(client),
      canToggleSocialListening:
        this.clientAccess.canToggleSocialListeningForTeam(client),
    }
  }

  async listOrgTeamForClient(client: AuthenticatedClient) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const members = await this.getOrgTeam(organizationId)
    const filtered = this.clientAccess.filterOrgTeamForViewer(client, members)
    return {
      ok: true as const,
      members: filtered.map((user) => this.mapTeamMember(user)),
      canManage: this.clientAccess.canManageOrgTeam(client),
      permissions: this.teamHubPermissions(client),
    }
  }

  async getTeamHubForClient(client: AuthenticatedClient) {
    if (!this.clientAccess.canAccessTeamHub(client)) {
      throw new ForbiddenException('Team access requires owner or project manager role')
    }

    const organizationId = this.clientAccess.requireOrganizationId(client)
    const members = await this.getOrgTeam(organizationId)
    const filtered = this.clientAccess.filterOrgTeamForViewer(client, members)

    const projects = await this.prisma.clientProject.findMany({
      where: this.clientAccess.accessibleProjectsWhere(client),
      select: {
        id: true,
        title: true,
        status: true,
        phase: true,
        coverStoragePath: true,
        createdByUserId: true,
        createdBy: { select: { email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const projectIds = projects.map((p) => p.id)
    const explicitMembers =
      projectIds.length > 0
        ? await this.prisma.clientProjectMember.findMany({
            where: { projectId: { in: projectIds } },
            include: {
              user: {
                select: { id: true, email: true, clientOrgRole: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          })
        : []

    const membersByProject = new Map<string, ProjectMemberSummary[]>()
    for (const row of explicitMembers) {
      const list = membersByProject.get(row.projectId) ?? []
      list.push({
        id: row.id,
        userId: row.userId,
        email: row.user.email,
        clientOrgRole: row.user.clientOrgRole,
        access: row.access,
        grantedByUserId: row.grantedByUserId,
        createdAt: row.createdAt,
      })
      membersByProject.set(row.projectId, list)
    }

    const toCard = async (project: (typeof projects)[number]): Promise<ProjectTeamCard> => ({
      id: project.id,
      title: project.title,
      status: project.status,
      phase: project.phase,
      creatorUserId: project.createdByUserId,
      creatorEmail: project.createdBy.email,
      coverImageUrl: await this.resolveCoverImageUrl(project.coverStoragePath),
      canManage: await this.clientAccess.canManageProjectMembership(client, project.id),
      members: membersByProject.get(project.id) ?? [],
    })

    const allCards = await Promise.all(projects.map(toCard))

    let projectsOwned: ProjectTeamCard[]
    let projectsShared: ProjectTeamCard[]

    if (this.clientAccess.isOwner(client)) {
      projectsOwned = allCards
      projectsShared = []
    } else {
      projectsOwned = allCards.filter((p) => p.creatorUserId === client.id)
      projectsShared = allCards.filter(
        (p) => p.creatorUserId !== client.id,
      )
    }

    return {
      ok: true as const,
      viewerRole: client.clientOrgRole,
      permissions: this.teamHubPermissions(client),
      members: filtered.map((user) => this.mapTeamMember(user)),
      projectsOwned,
      projectsShared,
      pendingInviteRequests: await this.listPendingInviteRequestsForHub(client),
    }
  }

  private mapInviteRequest(row: {
    id: string
    email: string
    requestedClientOrgRole: ClientOrgRole
    status: ClientTeamInviteRequestStatus
    createdAt: Date
    rejectionReason: string | null
    requestedBy: { email: string }
  }): TeamInviteRequestSummary {
    return {
      id: row.id,
      email: row.email,
      requestedClientOrgRole: row.requestedClientOrgRole,
      status: row.status,
      requestedByEmail: row.requestedBy.email,
      createdAt: row.createdAt,
      rejectionReason: row.rejectionReason,
    }
  }

  private async listPendingInviteRequestsForHub(
    client: AuthenticatedClient,
  ): Promise<TeamInviteRequestSummary[]> {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const where = {
      organizationId,
      status: ClientTeamInviteRequestStatus.PENDING,
      ...(this.clientAccess.isOwner(client)
        ? {}
        : { requestedByUserId: client.id }),
    }

    const rows = await this.prisma.clientTeamInviteRequest.findMany({
      where,
      include: { requestedBy: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => this.mapInviteRequest(row))
  }

  async listOrgTeamForAdmin(organizationId: string) {
    const members = await this.getOrgTeam(organizationId)
    return {
      ok: true as const,
      members: members.map((user) => this.mapTeamMember(user)),
    }
  }

  async inviteToOrganization(
    organizationId: string,
    dto: InviteTeamMemberDto,
    invitedByUserId: string,
  ) {
    if (dto.clientOrgRole === ClientOrgRole.OWNER) {
      const existingOwners = await this.prisma.user.count({
        where: {
          organizationId,
          role: UserRole.CLIENT,
          clientOrgRole: ClientOrgRole.OWNER,
          status: { not: UserStatus.SUSPENDED },
        },
      })
      if (existingOwners > 0) {
        throw new BadRequestException(
          'This organization already has an owner. Transfer ownership instead.',
        )
      }
    }

    const email = this.normalizeEmail(dto.email)
    const existingUser = await this.prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ConflictException(`A user with email ${email} already exists`)
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    })
    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    const canAccessSocialListening =
      dto.canAccessSocialListening ??
      (dto.clientOrgRole === ClientOrgRole.OWNER &&
        organization.isSocialListeningSubscriber)

    const user = await this.prisma.user.create({
      data: {
        email,
        organizationId,
        role: UserRole.CLIENT,
        status: UserStatus.INVITED,
        clientOrgRole: dto.clientOrgRole,
        canAccessSocialListening,
      },
    })

    let invitation: Awaited<ReturnType<SupabaseAuthService['inviteUserByEmail']>>
    try {
      invitation = await this.supabaseAuth.inviteUserByEmail({
        email,
        organizationId: organization.id,
        organizationSlug: organization.slug,
        redirectTo: this.portalCallbackUrl(),
      })
    } catch (err) {
      await this.prisma.user.delete({ where: { id: user.id } })
      throw err
    }

    if (invitation.status === 'sent') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: invitation.invitationId },
      })
    }

    const refreshed = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    })

    return {
      ok: true as const,
      member: this.mapTeamMember(refreshed),
      invitedByUserId,
      invitation: {
        provider: 'supabase-auth' as const,
        status: invitation.status,
        invitationId: invitation.invitationId,
        ...(invitation.devSignInUrl
          ? { devSignInUrl: invitation.devSignInUrl }
          : {}),
      },
    }
  }

  async inviteToOrganizationAsClient(
    client: AuthenticatedClient,
    dto: InviteTeamMemberDto,
  ) {
    if (!this.clientAccess.canManageOrgTeam(client)) {
      throw new ForbiddenException('Organization owner access required')
    }
    if (dto.clientOrgRole === ClientOrgRole.OWNER) {
      throw new ForbiddenException('Cannot invite another owner from the client portal')
    }
    const organizationId = this.clientAccess.requireOrganizationId(client)
    return this.inviteToOrganization(organizationId, dto, client.id)
  }

  async inviteToOrganizationAsAdmin(
    _admin: AuthenticatedAdmin,
    organizationId: string,
    dto: InviteTeamMemberDto,
  ) {
    return this.inviteToOrganization(organizationId, dto, _admin.id)
  }

  async updateTeamMemberAsClient(
    client: AuthenticatedClient,
    memberUserId: string,
    dto: UpdateTeamMemberDto,
  ) {
    if (!this.clientAccess.canManageOrgRoles(client)) {
      throw new ForbiddenException('You cannot manage organization roles')
    }

    const organizationId = this.clientAccess.requireOrganizationId(client)
    const member = await this.prisma.user.findFirst({
      where: {
        id: memberUserId,
        organizationId,
        role: UserRole.CLIENT,
      },
    })
    if (!member) {
      throw new NotFoundException('Team member not found')
    }

    this.clientAccess.assertPmCanUpdateTeamMember(client, member, dto)

    if (!this.clientAccess.isOwner(client)) {
      if (dto.clientOrgRole === undefined) {
        throw new BadRequestException('clientOrgRole is required')
      }
    }

    return this.updateTeamMember(organizationId, memberUserId, dto, client.id)
  }

  async updateTeamMemberAsAdmin(
    organizationId: string,
    memberUserId: string,
    dto: UpdateTeamMemberDto,
  ) {
    return this.updateTeamMember(organizationId, memberUserId, dto)
  }

  private async updateTeamMember(
    organizationId: string,
    memberUserId: string,
    dto: UpdateTeamMemberDto,
    actorUserId?: string,
  ) {
    const member = await this.prisma.user.findFirst({
      where: {
        id: memberUserId,
        organizationId,
        role: UserRole.CLIENT,
      },
    })
    if (!member) {
      throw new NotFoundException('Team member not found')
    }

    if (dto.clientOrgRole === ClientOrgRole.OWNER && member.clientOrgRole !== ClientOrgRole.OWNER) {
      const owners = await this.prisma.user.count({
        where: {
          organizationId,
          role: UserRole.CLIENT,
          clientOrgRole: ClientOrgRole.OWNER,
          status: { not: UserStatus.SUSPENDED },
          id: { not: memberUserId },
        },
      })
      if (owners > 0) {
        throw new BadRequestException('Organization already has an owner')
      }
    }

    if (
      member.clientOrgRole === ClientOrgRole.OWNER &&
      dto.clientOrgRole &&
      dto.clientOrgRole !== ClientOrgRole.OWNER
    ) {
      const ownerCount = await this.prisma.user.count({
        where: {
          organizationId,
          role: UserRole.CLIENT,
          clientOrgRole: ClientOrgRole.OWNER,
          status: { not: UserStatus.SUSPENDED },
        },
      })
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the last organization owner')
      }
    }

    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    })

    let canAccessSocialListening = dto.canAccessSocialListening
    if (
      canAccessSocialListening === undefined &&
      dto.clientOrgRole === ClientOrgRole.OWNER
    ) {
      canAccessSocialListening = organization.isSocialListeningSubscriber
    }

    const updated = await this.prisma.user.update({
      where: { id: memberUserId },
      data: {
        ...(dto.clientOrgRole !== undefined
          ? { clientOrgRole: dto.clientOrgRole }
          : {}),
        ...(canAccessSocialListening !== undefined
          ? { canAccessSocialListening }
          : {}),
      },
    })

    return {
      ok: true as const,
      member: this.mapTeamMember(updated),
      updatedByUserId: actorUserId ?? null,
    }
  }

  async suspendTeamMember(organizationId: string, memberUserId: string) {
    const member = await this.prisma.user.findFirst({
      where: {
        id: memberUserId,
        organizationId,
        role: UserRole.CLIENT,
      },
    })
    if (!member) {
      throw new NotFoundException('Team member not found')
    }
    if (member.clientOrgRole === ClientOrgRole.OWNER) {
      const ownerCount = await this.prisma.user.count({
        where: {
          organizationId,
          role: UserRole.CLIENT,
          clientOrgRole: ClientOrgRole.OWNER,
          status: { not: UserStatus.SUSPENDED },
        },
      })
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot suspend the last organization owner')
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: memberUserId },
      data: { status: UserStatus.SUSPENDED },
    })
    return { ok: true as const, member: this.mapTeamMember(updated) }
  }

  async listProjectMembers(client: AuthenticatedClient, projectId: string) {
    await this.clientAccess.assertProjectAccess(client, projectId, 'VIEW')
    const project = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            clientOrgRole: true,
          },
        },
      },
    })

    const explicit = await this.prisma.clientProjectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            clientOrgRole: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const members: ProjectMemberSummary[] = explicit.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.user.email,
      clientOrgRole: row.user.clientOrgRole,
      access: row.access,
      grantedByUserId: row.grantedByUserId,
      createdAt: row.createdAt,
    }))

    return {
      ok: true as const,
      projectId,
      creator: {
        userId: project.createdByUserId,
        email: project.createdBy.email,
        implicitAccess: 'MANAGE' as const,
      },
      members,
      canManage: await this.clientAccess.canManageProjectMembership(client, projectId),
    }
  }

  async addProjectMember(
    client: AuthenticatedClient,
    projectId: string,
    dto: AddProjectMemberDto,
  ) {
    await this.clientAccess.assertCanManageProjectMembership(client, projectId)

    const email = this.normalizeEmail(dto.email)
    const organizationId = this.clientAccess.requireOrganizationId(client)

    const targetUser = await this.prisma.user.findFirst({
      where: {
        email,
        organizationId,
        role: UserRole.CLIENT,
        status: { not: UserStatus.SUSPENDED },
      },
    })
    if (!targetUser) {
      throw new NotFoundException(
        'No active team member found with that email in your organization',
      )
    }

    const project = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      select: { createdByUserId: true },
    })

    if (targetUser.id === project.createdByUserId) {
      throw new BadRequestException('Project creator already has access')
    }

    if (targetUser.clientOrgRole === ClientOrgRole.OWNER) {
      throw new BadRequestException(
        'Organization owners already have access to all projects',
      )
    }

    const row = await this.prisma.clientProjectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: targetUser.id },
      },
      create: {
        projectId,
        userId: targetUser.id,
        access: dto.access,
        grantedByUserId: client.id,
      },
      update: {
        access: dto.access,
        grantedByUserId: client.id,
      },
      include: {
        user: {
          select: { id: true, email: true, clientOrgRole: true },
        },
      },
    })

    return {
      ok: true as const,
      member: {
        id: row.id,
        userId: row.userId,
        email: row.user.email,
        clientOrgRole: row.user.clientOrgRole,
        access: row.access,
        grantedByUserId: row.grantedByUserId,
        createdAt: row.createdAt,
      },
    }
  }

  async removeProjectMember(
    client: AuthenticatedClient,
    projectId: string,
    memberUserId: string,
  ) {
    await this.clientAccess.assertCanManageProjectMembership(client, projectId)

    const project = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      select: { createdByUserId: true },
    })
    if (memberUserId === project.createdByUserId) {
      throw new BadRequestException('Cannot remove the project creator')
    }

    await this.prisma.clientProjectMember.deleteMany({
      where: { projectId, userId: memberUserId },
    })

    return { ok: true as const }
  }

  async requestOrgInviteAsProjectManager(
    client: AuthenticatedClient,
    dto: RequestTeamInviteDto,
  ) {
    if (!this.clientAccess.canRequestOrgInvite(client)) {
      throw new ForbiddenException('Only project managers can request new invites')
    }

    if (dto.clientOrgRole === ClientOrgRole.OWNER) {
      throw new BadRequestException('Cannot request organization owner invite')
    }

    const organizationId = this.clientAccess.requireOrganizationId(client)
    const email = this.normalizeEmail(dto.email)

    const existingUser = await this.prisma.user.findUnique({ where: { email } })
    if (existingUser?.organizationId === organizationId) {
      throw new ConflictException('This email is already on your organization team')
    }
    if (existingUser) {
      throw new ConflictException(`A user with email ${email} already exists`)
    }

    const pending = await this.prisma.clientTeamInviteRequest.findFirst({
      where: {
        organizationId,
        email,
        status: ClientTeamInviteRequestStatus.PENDING,
      },
    })
    if (pending) {
      throw new ConflictException('An invite request for this email is already pending')
    }

    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    })

    const row = await this.prisma.clientTeamInviteRequest.create({
      data: {
        organizationId,
        email,
        requestedClientOrgRole: dto.clientOrgRole,
        canAccessSocialListening: false,
        requestedByUserId: client.id,
      },
      include: { requestedBy: { select: { email: true } } },
    })

    const adminLink = `${this.notifications.adminClientWorkspaceLink(organizationId)}?tab=team&inviteRequestId=${row.id}`
    const roleLabel =
      dto.clientOrgRole === ClientOrgRole.PROJECT_MANAGER
        ? 'project manager'
        : 'member'

    await this.notifications.notifyAdmins({
      organizationId,
      type: PortalNotificationType.TEAM_INVITE_REQUEST,
      title: 'Team invite approval needed',
      body: `${client.email} requested adding ${email} as ${roleLabel} for ${organization.name}.`,
      href: adminLink,
      email: {
        subject: `[CoCreate] Team invite request — ${organization.name}`,
        html: `<p><strong>${client.email}</strong> requested inviting <strong>${email}</strong> as ${roleLabel} for <strong>${organization.name}</strong>.</p><p><a href="${adminLink}">Review in Admin Center</a></p>`,
        text: `${client.email} requested inviting ${email} as ${roleLabel} for ${organization.name}. Review: ${adminLink}`,
        actionLink: adminLink,
      },
    })

    return {
      ok: true as const,
      request: this.mapInviteRequest(row),
    }
  }

  async listInviteRequestsForAdmin(
    organizationId: string,
    status?: ClientTeamInviteRequestStatus,
  ) {
    const rows = await this.prisma.clientTeamInviteRequest.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: { requestedBy: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return {
      ok: true as const,
      requests: rows.map((row) => this.mapInviteRequest(row)),
    }
  }

  async approveInviteRequest(
    admin: AuthenticatedAdmin,
    organizationId: string,
    requestId: string,
  ) {
    const row = await this.prisma.clientTeamInviteRequest.findFirst({
      where: { id: requestId, organizationId },
    })
    if (!row) {
      throw new NotFoundException('Invite request not found')
    }
    if (row.status !== ClientTeamInviteRequestStatus.PENDING) {
      throw new BadRequestException('Invite request is no longer pending')
    }

    const result = await this.inviteToOrganization(
      organizationId,
      {
        email: row.email,
        clientOrgRole: row.requestedClientOrgRole,
        canAccessSocialListening: row.canAccessSocialListening,
      },
      admin.id,
    )

    await this.prisma.clientTeamInviteRequest.update({
      where: { id: requestId },
      data: {
        status: ClientTeamInviteRequestStatus.APPROVED,
        reviewedByUserId: admin.id,
        reviewedAt: new Date(),
        resultingUserId: result.member.id,
      },
    })

    return { ok: true as const, member: result.member, invitation: result.invitation }
  }

  async rejectInviteRequest(
    admin: AuthenticatedAdmin,
    organizationId: string,
    requestId: string,
    dto: RejectTeamInviteDto,
  ) {
    const row = await this.prisma.clientTeamInviteRequest.findFirst({
      where: { id: requestId, organizationId },
    })
    if (!row) {
      throw new NotFoundException('Invite request not found')
    }
    if (row.status !== ClientTeamInviteRequestStatus.PENDING) {
      throw new BadRequestException('Invite request is no longer pending')
    }

    await this.prisma.clientTeamInviteRequest.update({
      where: { id: requestId },
      data: {
        status: ClientTeamInviteRequestStatus.REJECTED,
        reviewedByUserId: admin.id,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason?.trim() || null,
      },
    })

    return { ok: true as const }
  }
}
