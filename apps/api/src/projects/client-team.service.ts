import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientOrgRole,
  ClientTeamInviteRequestStatus,
  PortalNotificationType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import type { AuthenticatedAdmin, AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import type {
  InviteTeamMemberInput,
  UpdateTeamMemberInput,
  AddProjectMemberInput,
  RequestTeamInviteInput,
  RejectTeamInviteInput,
  TransferProjectOwnershipInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import type {
  AssignableProjectMember,
  ClientTeamMember,
  ProjectMember,
  ProjectTeamCard,
  TeamHubPermissions,
  TeamInviteRequest,
} from '@cocreate/api-contracts/v1/shared/team'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'

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

  private mapTeamMember(row: {
    id: string
    email: string
    status: UserStatus
    clientOrgRole: ClientOrgRole | null
    canAccessSocialListening: boolean
    canAccessGetHelp: boolean
    createdAt: Date
    updatedAt: Date
  }): ClientTeamMember {
    return {
      id: row.id,
      email: row.email,
      status: row.status,
      clientOrgRole: row.clientOrgRole,
      canAccessSocialListening: row.canAccessSocialListening,
      canAccessGetHelp: row.canAccessGetHelp,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  private mapMembershipToTeamMember(membership: {
    status: UserStatus
    clientOrgRole: ClientOrgRole
    canAccessSocialListening: boolean
    canAccessGetHelp: boolean
    createdAt: Date
    updatedAt: Date
    user: { id: string; email: string }
  }): ClientTeamMember {
    return this.mapTeamMember({
      id: membership.user.id,
      email: membership.user.email,
      status: membership.status,
      clientOrgRole: membership.clientOrgRole,
      canAccessSocialListening: membership.canAccessSocialListening,
      canAccessGetHelp: membership.canAccessGetHelp,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    })
  }

  private async getOrgTeam(organizationId: string) {
    return this.prisma.clientOrganizationMembership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true, deletedAt: true } },
      },
      orderBy: [{ clientOrgRole: 'asc' }, { createdAt: 'asc' }],
    })
  }

  private async getOrgMembershipOrThrow(organizationId: string, userId: string) {
    const membership = await this.prisma.clientOrganizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      include: {
        user: { select: { id: true, email: true, role: true, deletedAt: true } },
      },
    })
    if (!membership || membership.user.deletedAt) {
      throw new NotFoundException('Team member not found')
    }
    return membership
  }

  private async resolveOrgRole(
    organizationId: string,
    userId: string,
  ): Promise<ClientOrgRole | null> {
    const membership = await this.prisma.clientOrganizationMembership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { clientOrgRole: true },
    })
    return membership?.clientOrgRole ?? null
  }

  private teamHubPermissions(client: AuthenticatedClient): TeamHubPermissions {
    return {
      canManageOrgRoles: this.clientAccess.canManageOrgRoles(client),
      canInviteImmediately: this.clientAccess.canInviteOrgMemberImmediately(client),
      canRequestInvite: this.clientAccess.canRequestOrgInvite(client),
      canToggleSocialListening:
        this.clientAccess.canToggleSocialListeningForTeam(client),
      canToggleGetHelp: this.clientAccess.canToggleGetHelpForTeam(client),
    }
  }

  async listOrgTeamForClient(client: AuthenticatedClient) {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const members = await this.getOrgTeam(organizationId)
    const filtered = this.clientAccess.filterOrgTeamForViewer(client, members)
    return {
      ok: true as const,
      members: filtered.map((m) => this.mapMembershipToTeamMember(m)),
      canManage: this.clientAccess.canManageOrgTeam(client),
      permissions: this.teamHubPermissions(client),
    }
  }

  async getTeamHubForClient(client: AuthenticatedClient) {
    if (!this.clientAccess.canAccessTeamHub(client)) {
      throw new ForbiddenException('Team access requires admin role')
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
        ownerUserId: true,
        createdBy: { select: { email: true } },
        owner: { select: { email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const projectIds = projects.map((p) => p.id)
    const ownerByProject = new Map(
      projects.map((p) => [p.id, p.ownerUserId]),
    )
    const explicitMembers =
      projectIds.length > 0
        ? await this.prisma.clientProjectMember.findMany({
            where: { projectId: { in: projectIds } },
            include: {
              user: {
                select: { id: true, email: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          })
        : []

    const orgRoles = await this.prisma.clientOrganizationMembership.findMany({
      where: {
        organizationId,
        userId: { in: explicitMembers.map((r) => r.userId) },
      },
      select: { userId: true, clientOrgRole: true },
    })
    const roleByUser = new Map(orgRoles.map((r) => [r.userId, r.clientOrgRole]))

    const membersByProject = new Map<string, ProjectMember[]>()
    for (const row of explicitMembers) {
      const list = membersByProject.get(row.projectId) ?? []
      list.push({
        id: row.id,
        userId: row.userId,
        email: row.user.email,
        clientOrgRole: roleByUser.get(row.userId) ?? null,
        isOwner: ownerByProject.get(row.projectId) === row.userId,
        grantedByUserId: row.grantedByUserId,
        createdAt: row.createdAt.toISOString(),
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
      ownerUserId: project.ownerUserId,
      ownerEmail: project.owner?.email ?? null,
      coverImageUrl: await this.resolveCoverImageUrl(project.coverStoragePath),
      canManage: await this.clientAccess.canManageProjectMembership(client, project.id),
      viewerIsOwner: project.ownerUserId === client.id,
      members: membersByProject.get(project.id) ?? [],
    })

    const allCards = await Promise.all(projects.map(toCard))

    const projectsOwned = allCards.filter((p) => p.ownerUserId === client.id)
    const projectsShared = allCards.filter((p) => p.ownerUserId !== client.id)

    return {
      ok: true as const,
      viewerRole: client.clientOrgRole,
      permissions: this.teamHubPermissions(client),
      members: filtered.map((m) => this.mapMembershipToTeamMember(m)),
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
  }): TeamInviteRequest {
    return {
      id: row.id,
      email: row.email,
      requestedClientOrgRole: row.requestedClientOrgRole,
      status: row.status,
      requestedByEmail: row.requestedBy.email,
      createdAt: row.createdAt.toISOString(),
      rejectionReason: row.rejectionReason,
    }
  }

  private async listPendingInviteRequestsForHub(
    client: AuthenticatedClient,
  ): Promise<TeamInviteRequest[]> {
    const organizationId = this.clientAccess.requireOrganizationId(client)
    const where = {
      organizationId,
      status: ClientTeamInviteRequestStatus.PENDING,
      ...(this.clientAccess.isAdmin(client)
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
      members: members.map((m) => this.mapMembershipToTeamMember(m)),
    }
  }

  async inviteToOrganization(
    organizationId: string,
    dto: InviteTeamMemberInput,
    invitedByUserId: string,
    projectInvite?: { projectTitle: string; organizationName: string },
  ) {
    const email = this.normalizeEmail(dto.email)
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    })
    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    const canAccessSocialListening =
      dto.canAccessSocialListening ??
      ((dto.clientOrgRole === ClientOrgRole.ADMIN ||
        dto.clientOrgRole === ClientOrgRole.SOCIAL_ANALYST) &&
        organization.isSocialListeningSubscriber)

    const canAccessGetHelp =
      dto.canAccessGetHelp ??
      (dto.clientOrgRole === ClientOrgRole.ADMIN ||
        dto.clientOrgRole === ClientOrgRole.CONTRIBUTOR)

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: {
          where: { organizationId },
          take: 1,
        },
      },
    })

    if (existingUser) {
      if (existingUser.role !== UserRole.CLIENT) {
        throw new ConflictException(
          'This email is an agency account and can’t join a client org',
        )
      }

      if (existingUser.organizationMemberships.length > 0) {
        throw new ConflictException('Already on this team')
      }

      // Soft-deleted leftover: revive identity into this org
      if (existingUser.deletedAt) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { deletedAt: null },
        })
      }

      const hasActiveElsewhere = await this.prisma.clientOrganizationMembership.findFirst({
        where: {
          userId: existingUser.id,
          status: UserStatus.ACTIVE,
          organizationId: { not: organizationId },
        },
      })

      const membershipStatus = hasActiveElsewhere
        ? UserStatus.ACTIVE
        : existingUser.supabaseAuthId
          ? UserStatus.ACTIVE
          : UserStatus.INVITED

      const membership = await this.prisma.clientOrganizationMembership.create({
        data: {
          userId: existingUser.id,
          organizationId,
          clientOrgRole: dto.clientOrgRole,
          status: membershipStatus,
          canAccessSocialListening,
          canAccessGetHelp,
        },
        include: {
          user: { select: { id: true, email: true } },
        },
      })

      // Keep legacy User fields loosely in sync for dual-read cutover
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          organizationId:
            existingUser.organizationId ?? organizationId,
          lastActiveOrganizationId:
            existingUser.lastActiveOrganizationId ?? organizationId,
          clientOrgRole: dto.clientOrgRole,
          canAccessSocialListening,
          status:
            membershipStatus === UserStatus.ACTIVE
              ? UserStatus.ACTIVE
              : existingUser.status,
        },
      })

      if (hasActiveElsewhere || existingUser.supabaseAuthId) {
        await this.notifications.notifyClientUsers({
          organizationId,
          userIds: [existingUser.id],
          type: PortalNotificationType.ORGANIZATION_MEMBERSHIP_ADDED,
          title: `Added to ${organization.name}`,
          body: `You’ve been added to ${organization.name} as ${dto.clientOrgRole.toLowerCase().replace(/_/g, ' ')}.`,
          href: '/',
        })
        const portalBase =
          process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
        await this.supabaseAuth.notifyExistingClientAddedToOrg({
          email,
          organizationName: organization.name,
          roleLabel: dto.clientOrgRole.toLowerCase().replace(/_/g, ' '),
          portalUrl: portalBase,
        })
      } else {
        // Still needs Auth invite
        const invitation = await this.supabaseAuth.inviteUserByEmail({
          email,
          organizationId: organization.id,
          organizationSlug: organization.slug,
          redirectTo: this.portalCallbackUrlWithOrg(organization.id),
          ...(projectInvite
            ? {
                projectTitle: projectInvite.projectTitle,
                organizationName: projectInvite.organizationName,
                inviteContext: 'new_project' as const,
              }
            : {}),
        })
        if (invitation.status === 'sent' && invitation.invitationId) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { supabaseAuthId: invitation.invitationId },
          })
        }
        return {
          ok: true as const,
          member: this.mapMembershipToTeamMember(membership),
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

      return {
        ok: true as const,
        member: this.mapMembershipToTeamMember(membership),
        invitedByUserId,
        invitation: {
          provider: 'supabase-auth' as const,
          status: 'added' as const,
        },
      }
    }

    // Brand-new identity
    const user = await this.prisma.user.create({
      data: {
        email,
        organizationId,
        lastActiveOrganizationId: organizationId,
        role: UserRole.CLIENT,
        status: UserStatus.INVITED,
        clientOrgRole: dto.clientOrgRole,
        canAccessSocialListening,
        organizationMemberships: {
          create: {
            organizationId,
            clientOrgRole: dto.clientOrgRole,
            status: UserStatus.INVITED,
            canAccessSocialListening,
            canAccessGetHelp,
          },
        },
      },
      include: {
        organizationMemberships: {
          where: { organizationId },
          include: { user: { select: { id: true, email: true } } },
        },
      },
    })

    let invitation: Awaited<ReturnType<SupabaseAuthService['inviteUserByEmail']>>
    try {
      invitation = await this.supabaseAuth.inviteUserByEmail({
        email,
        organizationId: organization.id,
        organizationSlug: organization.slug,
        redirectTo: this.portalCallbackUrlWithOrg(organization.id),
        ...(projectInvite
          ? {
              projectTitle: projectInvite.projectTitle,
              organizationName: projectInvite.organizationName,
              inviteContext: 'new_project' as const,
            }
          : {}),
      })
    } catch (err) {
      await this.prisma.clientOrganizationMembership.deleteMany({
        where: { userId: user.id, organizationId },
      })
      await this.prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      })
      throw err
    }

    if (invitation.status === 'sent') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: invitation.invitationId },
      })
    }

    const membership = user.organizationMemberships[0]!
    return {
      ok: true as const,
      member: this.mapMembershipToTeamMember({
        ...membership,
        user: { id: user.id, email: user.email },
      }),
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

  private portalCallbackUrlWithOrg(organizationId: string) {
    const base = this.portalCallbackUrl()
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}organizationId=${encodeURIComponent(organizationId)}`
  }

  async inviteToOrganizationAsClient(
    client: AuthenticatedClient,
    dto: InviteTeamMemberInput,
  ) {
    if (!this.clientAccess.canManageOrgTeam(client)) {
      throw new ForbiddenException('Organization admin access required')
    }
    const organizationId = this.clientAccess.requireOrganizationId(client)
    return this.inviteToOrganization(organizationId, dto, client.id)
  }

  async inviteToOrganizationAsAdmin(
    _admin: AuthenticatedAdmin,
    organizationId: string,
    dto: InviteTeamMemberInput,
    projectInvite?: { projectTitle: string; organizationName: string },
  ) {
    return this.inviteToOrganization(
      organizationId,
      dto,
      _admin.id,
      projectInvite,
    )
  }

  async updateTeamMemberAsClient(
    client: AuthenticatedClient,
    memberUserId: string,
    dto: UpdateTeamMemberInput,
  ) {
    if (!this.clientAccess.canManageOrgRoles(client)) {
      throw new ForbiddenException('You cannot manage organization roles')
    }

    const organizationId = this.clientAccess.requireOrganizationId(client)
    const membership = await this.getOrgMembershipOrThrow(organizationId, memberUserId)

    this.clientAccess.assertCanUpdateTeamMember(
      client,
      { clientOrgRole: membership.clientOrgRole, id: membership.userId },
      dto,
    )

    return this.updateTeamMember(organizationId, memberUserId, dto, client.id)
  }

  async updateTeamMemberAsAdmin(
    organizationId: string,
    memberUserId: string,
    dto: UpdateTeamMemberInput,
  ) {
    return this.updateTeamMember(organizationId, memberUserId, dto)
  }

  private async updateTeamMember(
    organizationId: string,
    memberUserId: string,
    dto: UpdateTeamMemberInput,
    actorUserId?: string,
  ) {
    const membership = await this.getOrgMembershipOrThrow(organizationId, memberUserId)

    if (
      membership.clientOrgRole === ClientOrgRole.ADMIN &&
      dto.clientOrgRole &&
      dto.clientOrgRole !== ClientOrgRole.ADMIN
    ) {
      await this.clientAccess.assertAdminCanBeDemoted(organizationId, memberUserId)
    }

    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    })

    let canAccessSocialListening = dto.canAccessSocialListening
    if (
      canAccessSocialListening === undefined &&
      (dto.clientOrgRole === ClientOrgRole.ADMIN ||
        dto.clientOrgRole === ClientOrgRole.SOCIAL_ANALYST)
    ) {
      canAccessSocialListening = organization.isSocialListeningSubscriber
    }

    let canAccessGetHelp = dto.canAccessGetHelp
    if (
      canAccessGetHelp === undefined &&
      (dto.clientOrgRole === ClientOrgRole.ADMIN ||
        dto.clientOrgRole === ClientOrgRole.CONTRIBUTOR)
    ) {
      canAccessGetHelp = true
    }

    const updated = await this.prisma.clientOrganizationMembership.update({
      where: { id: membership.id },
      data: {
        ...(dto.clientOrgRole !== undefined
          ? { clientOrgRole: dto.clientOrgRole }
          : {}),
        ...(canAccessSocialListening !== undefined
          ? { canAccessSocialListening }
          : {}),
        ...(canAccessGetHelp !== undefined ? { canAccessGetHelp } : {}),
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    })

    // Dual-write legacy User fields when this is their lastActive / only org
    await this.prisma.user.update({
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
      member: this.mapMembershipToTeamMember(updated),
      updatedByUserId: actorUserId ?? null,
    }
  }

  async suspendTeamMember(organizationId: string, memberUserId: string) {
    const membership = await this.getOrgMembershipOrThrow(organizationId, memberUserId)
    if (membership.clientOrgRole === ClientOrgRole.ADMIN) {
      await this.clientAccess.assertAdminCanBeDemoted(organizationId, memberUserId)
    }

    const updated = await this.prisma.clientOrganizationMembership.update({
      where: { id: membership.id },
      data: { status: UserStatus.SUSPENDED },
      include: {
        user: { select: { id: true, email: true } },
      },
    })
    return { ok: true as const, member: this.mapMembershipToTeamMember(updated) }
  }

  /**
   * Hard-remove org membership so the email can be re-invited.
   * Also clears project assignments in this org.
   */
  async removeOrgMembership(
    organizationId: string,
    memberUserId: string,
    actorUserId: string,
  ) {
    if (memberUserId === actorUserId) {
      throw new BadRequestException('You cannot remove yourself from the team')
    }

    const membership = await this.getOrgMembershipOrThrow(organizationId, memberUserId)

    if (membership.clientOrgRole === ClientOrgRole.ADMIN) {
      await this.clientAccess.assertAdminCanBeDemoted(organizationId, memberUserId)
    }

    const ownedProjects = await this.prisma.clientProject.count({
      where: { organizationId, ownerUserId: memberUserId },
    })
    if (ownedProjects > 0) {
      throw new BadRequestException(
        'Cannot remove a project owner — transfer ownership of their projects first',
      )
    }

    await this.prisma.clientProjectMember.deleteMany({
      where: {
        userId: memberUserId,
        project: { organizationId },
      },
    })

    await this.prisma.clientOrganizationMembership.delete({
      where: { id: membership.id },
    })

    const user = await this.prisma.user.findUnique({
      where: { id: memberUserId },
      select: {
        organizationId: true,
        lastActiveOrganizationId: true,
      },
    })
    if (user) {
      await this.prisma.user.update({
        where: { id: memberUserId },
        data: {
          ...(user.organizationId === organizationId
            ? { organizationId: null }
            : {}),
          ...(user.lastActiveOrganizationId === organizationId
            ? { lastActiveOrganizationId: null }
            : {}),
        },
      })
    }

    return { ok: true as const }
  }

  async removeOrgMembershipAsClient(
    client: AuthenticatedClient,
    memberUserId: string,
  ) {
    if (!this.clientAccess.canManageOrgTeam(client)) {
      throw new ForbiddenException('Organization admin access required')
    }
    const organizationId = this.clientAccess.requireOrganizationId(client)
    return this.removeOrgMembership(organizationId, memberUserId, client.id)
  }

  async listProjectMembers(client: AuthenticatedClient, projectId: string) {
    await this.clientAccess.assertProjectAccess(client, projectId, 'VIEW')
    const project = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,
        ownerUserId: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            clientOrgRole: true,
          },
        },
        owner: {
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

    const members: ProjectMember[] = explicit.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.user.email,
      clientOrgRole: row.user.clientOrgRole,
      isOwner: row.userId === project.ownerUserId,
      grantedByUserId: row.grantedByUserId,
      createdAt: row.createdAt.toISOString(),
    }))

    const canManage = await this.clientAccess.canManageProjectMembership(client, projectId)
    let assignableMembers: AssignableProjectMember[] | undefined

    if (canManage) {
      const orgMemberships = await this.prisma.clientOrganizationMembership.findMany({
        where: {
          organizationId: project.organizationId,
          status: { not: UserStatus.SUSPENDED },
          clientOrgRole: {
            in: [ClientOrgRole.CONTRIBUTOR, ClientOrgRole.VIEWER],
          },
        },
        include: {
          user: { select: { id: true, email: true } },
        },
        orderBy: [{ clientOrgRole: 'asc' }, { createdAt: 'asc' }],
      })
      const assignedUserIds = new Set([
        project.createdByUserId,
        project.ownerUserId,
        ...members.map((member) => member.userId),
      ])
      // Admins already have access to every project; Social Analysts never do.
      assignableMembers = orgMemberships
        .filter((m) => !assignedUserIds.has(m.userId))
        .map((m) => ({
          userId: m.userId,
          email: m.user.email,
          clientOrgRole: m.clientOrgRole,
        }))
    }

    return {
      ok: true as const,
      projectId,
      creator: {
        userId: project.createdByUserId,
        email: project.createdBy.email,
        implicitAccess: 'MANAGE' as const,
      },
      ownerUserId: project.ownerUserId,
      ownerEmail: project.owner?.email ?? null,
      viewerIsOwner: project.ownerUserId === client.id,
      canTransferOwnership: project.ownerUserId === client.id,
      members,
      canManage,
      assignableMembers,
    }
  }

  /** Admin Center view of a project's team — full manage capability. */
  async listProjectMembersForAdmin(projectId: string) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,
        ownerUserId: true,
        createdBy: { select: { id: true, email: true, clientOrgRole: true } },
        owner: { select: { id: true, email: true, clientOrgRole: true } },
      },
    })
    if (!project) throw new NotFoundException('Project not found')

    const explicit = await this.prisma.clientProjectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, email: true, clientOrgRole: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const members: ProjectMember[] = explicit.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.user.email,
      clientOrgRole: row.user.clientOrgRole,
      isOwner: row.userId === project.ownerUserId,
      grantedByUserId: row.grantedByUserId,
      createdAt: row.createdAt.toISOString(),
    }))

    const orgMemberships = await this.prisma.clientOrganizationMembership.findMany({
      where: {
        organizationId: project.organizationId,
        status: { not: UserStatus.SUSPENDED },
        clientOrgRole: {
          in: [ClientOrgRole.CONTRIBUTOR, ClientOrgRole.VIEWER],
        },
      },
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: [{ clientOrgRole: 'asc' }, { createdAt: 'asc' }],
    })
    const assignedUserIds = new Set([
      project.createdByUserId,
      project.ownerUserId,
      ...members.map((member) => member.userId),
    ])
    const assignableMembers: AssignableProjectMember[] = orgMemberships
      .filter((m) => !assignedUserIds.has(m.userId))
      .map((m) => ({
        userId: m.userId,
        email: m.user.email,
        clientOrgRole: m.clientOrgRole,
      }))

    return {
      ok: true as const,
      projectId,
      creator: {
        userId: project.createdByUserId,
        email: project.createdBy?.email ?? '',
        implicitAccess: 'MANAGE' as const,
      },
      ownerUserId: project.ownerUserId,
      ownerEmail: project.owner?.email ?? null,
      viewerIsOwner: false,
      canTransferOwnership: true,
      members,
      canManage: true,
      assignableMembers,
    }
  }

  async addProjectMemberAsAdmin(projectId: string, dto: AddProjectMemberInput) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: { organizationId: true, createdByUserId: true, ownerUserId: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    const email = this.normalizeEmail(dto.email)
    const membership = await this.prisma.clientOrganizationMembership.findFirst({
      where: {
        organizationId: project.organizationId,
        status: { not: UserStatus.SUSPENDED },
        user: { email, role: UserRole.CLIENT, deletedAt: null },
      },
      include: { user: { select: { id: true, email: true } } },
    })
    if (!membership) {
      throw new NotFoundException(
        'No active team member found with that email in this organization',
      )
    }
    if (
      membership.userId === project.createdByUserId ||
      membership.userId === project.ownerUserId
    ) {
      throw new BadRequestException('This person already has access')
    }
    if (membership.clientOrgRole === ClientOrgRole.ADMIN) {
      throw new BadRequestException('Admins already have access to all projects')
    }
    if (membership.clientOrgRole === ClientOrgRole.SOCIAL_ANALYST) {
      throw new BadRequestException('Social analysts cannot be assigned to projects')
    }

    const row = await this.prisma.clientProjectMember.upsert({
      where: { projectId_userId: { projectId, userId: membership.userId } },
      create: {
        projectId,
        userId: membership.userId,
        grantedByUserId: membership.userId,
      },
      update: {},
      include: {
        user: { select: { id: true, email: true } },
      },
    })

    return {
      ok: true as const,
      member: {
        id: row.id,
        userId: row.userId,
        email: row.user.email,
        clientOrgRole: membership.clientOrgRole,
        isOwner: false,
        grantedByUserId: row.grantedByUserId,
        createdAt: row.createdAt.toISOString(),
      },
    }
  }

  async removeProjectMemberAsAdmin(projectId: string, memberUserId: string) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: { createdByUserId: true, ownerUserId: true },
    })
    if (!project) throw new NotFoundException('Project not found')
    if (memberUserId === project.ownerUserId) {
      throw new BadRequestException(
        'Cannot remove the project owner — transfer ownership first',
      )
    }
    if (memberUserId === project.createdByUserId) {
      throw new BadRequestException('Cannot remove the project creator')
    }
    await this.prisma.clientProjectMember.deleteMany({
      where: { projectId, userId: memberUserId },
    })
    return { ok: true as const }
  }

  async addProjectMember(
    client: AuthenticatedClient,
    projectId: string,
    dto: AddProjectMemberInput,
  ) {
    await this.clientAccess.assertCanAssignToProject(client, projectId)

    const email = this.normalizeEmail(dto.email)
    const organizationId = this.clientAccess.requireOrganizationId(client)

    const membership = await this.prisma.clientOrganizationMembership.findFirst({
      where: {
        organizationId,
        status: { not: UserStatus.SUSPENDED },
        user: { email, role: UserRole.CLIENT, deletedAt: null },
      },
      include: { user: { select: { id: true, email: true } } },
    })
    if (!membership) {
      throw new NotFoundException(
        'No active team member found with that email in your organization',
      )
    }

    const project = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      select: { createdByUserId: true, ownerUserId: true },
    })

    if (
      membership.userId === project.createdByUserId ||
      membership.userId === project.ownerUserId
    ) {
      throw new BadRequestException('This person already has access')
    }

    if (membership.clientOrgRole === ClientOrgRole.ADMIN) {
      throw new BadRequestException(
        'Admins already have access to all projects',
      )
    }

    if (membership.clientOrgRole === ClientOrgRole.SOCIAL_ANALYST) {
      throw new BadRequestException(
        'Social analysts cannot be assigned to projects',
      )
    }

    const row = await this.prisma.clientProjectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: membership.userId },
      },
      create: {
        projectId,
        userId: membership.userId,
        grantedByUserId: client.id,
      },
      update: {
        grantedByUserId: client.id,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    })

    return {
      ok: true as const,
      member: {
        id: row.id,
        userId: row.userId,
        email: row.user.email,
        clientOrgRole: membership.clientOrgRole,
        isOwner: false,
        grantedByUserId: row.grantedByUserId,
        createdAt: row.createdAt.toISOString(),
      },
    }
  }

  async transferProjectOwnership(
    client: AuthenticatedClient,
    projectId: string,
    dto: TransferProjectOwnershipInput,
  ) {
    await this.clientAccess.assertCanTransferOwnership(client, projectId)
    const organizationId = this.clientAccess.requireOrganizationId(client)

    const newOwnerMembership = await this.prisma.clientOrganizationMembership.findFirst({
      where: {
        userId: dto.newOwnerUserId,
        organizationId,
        status: { not: UserStatus.SUSPENDED },
        clientOrgRole: ClientOrgRole.ADMIN,
      },
    })
    if (!newOwnerMembership) {
      throw new NotFoundException('New owner must be an Admin in your organization')
    }

    await this.prisma.clientProject.update({
      where: { id: projectId },
      data: { ownerUserId: dto.newOwnerUserId },
    })
    // Ensure the new owner (if assigned as an explicit member) stays clean.
    await this.prisma.clientProjectMember.deleteMany({
      where: { projectId, userId: dto.newOwnerUserId },
    })

    return { ok: true as const, ownerUserId: dto.newOwnerUserId }
  }

  async transferProjectOwnershipAsAdmin(
    projectId: string,
    dto: TransferProjectOwnershipInput,
  ) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    })
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    const newOwnerMembership = await this.prisma.clientOrganizationMembership.findFirst({
      where: {
        userId: dto.newOwnerUserId,
        organizationId: project.organizationId,
        status: { not: UserStatus.SUSPENDED },
      },
    })
    if (!newOwnerMembership) {
      throw new NotFoundException('New owner not found in this organization')
    }
    if (newOwnerMembership.clientOrgRole !== ClientOrgRole.ADMIN) {
      // Agency can promote the target to Admin so they can own the project.
      await this.prisma.clientOrganizationMembership.update({
        where: { id: newOwnerMembership.id },
        data: { clientOrgRole: ClientOrgRole.ADMIN },
      })
      await this.prisma.user.update({
        where: { id: dto.newOwnerUserId },
        data: { clientOrgRole: ClientOrgRole.ADMIN },
      })
    }

    await this.prisma.clientProject.update({
      where: { id: projectId },
      data: { ownerUserId: dto.newOwnerUserId },
    })
    await this.prisma.clientProjectMember.deleteMany({
      where: { projectId, userId: dto.newOwnerUserId },
    })

    return { ok: true as const, ownerUserId: dto.newOwnerUserId }
  }

  async removeProjectMember(
    client: AuthenticatedClient,
    projectId: string,
    memberUserId: string,
  ) {
    await this.clientAccess.assertCanAssignToProject(client, projectId)

    const project = await this.prisma.clientProject.findUniqueOrThrow({
      where: { id: projectId },
      select: { createdByUserId: true, ownerUserId: true },
    })
    if (memberUserId === project.ownerUserId) {
      throw new BadRequestException(
        'Cannot remove the project owner — transfer ownership first',
      )
    }
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
    dto: RequestTeamInviteInput,
  ) {
    if (!this.clientAccess.canRequestOrgInvite(client)) {
      throw new ForbiddenException(
        'Invite requests are no longer supported — ask an Admin to invite people directly',
      )
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
    const roleLabel = dto.clientOrgRole.toLowerCase()

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
    dto: RejectTeamInviteInput,
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
