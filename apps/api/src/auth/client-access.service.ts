import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ClientOrgRole, UserStatus, type Prisma } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedClient } from './auth.service'

/** Capability within a project after org-role + assignment checks */
export type ProjectCapability =
  | 'read'
  | 'write' // messages, files, reactions
  | 'owner' // assign members / transfer ownership

@Injectable()
export class ClientAccessService {
  constructor(private readonly prisma: PrismaService) {}

  requireOrganizationId(client: AuthenticatedClient): string {
    const orgId = client.organization?.id
    if (!orgId) {
      throw new ForbiddenException('No organization linked to your account')
    }
    return orgId
  }

  isAdmin(client: AuthenticatedClient): boolean {
    return client.clientOrgRole === ClientOrgRole.ADMIN
  }

  isContributor(client: AuthenticatedClient): boolean {
    return client.clientOrgRole === ClientOrgRole.CONTRIBUTOR
  }

  isViewer(client: AuthenticatedClient): boolean {
    return client.clientOrgRole === ClientOrgRole.VIEWER
  }

  isSocialAnalyst(client: AuthenticatedClient): boolean {
    return client.clientOrgRole === ClientOrgRole.SOCIAL_ANALYST
  }

  /** @deprecated use isAdmin */
  isOwner(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  /** @deprecated */
  isProjectManager(_client: AuthenticatedClient): boolean {
    return false
  }

  canCreateProject(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canAccessTeamHub(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canManageOrgTeam(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canManageOrgRoles(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canInviteOrgMemberImmediately(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canRequestOrgInvite(_client: AuthenticatedClient): boolean {
    return false
  }

  canToggleSocialListeningForTeam(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canToggleGetHelpForTeam(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canPromoteToAdmin(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canSendMessages(client: AuthenticatedClient): boolean {
    return this.isAdmin(client) || this.isContributor(client)
  }

  canReactToFiles(client: AuthenticatedClient): boolean {
    return this.isAdmin(client) || this.isContributor(client)
  }

  canViewSocialListening(client: AuthenticatedClient): boolean {
    const orgSubscribed = Boolean(client.organization?.isSocialListeningSubscriber)
    if (!orgSubscribed) return false
    if (this.isAdmin(client) || this.isSocialAnalyst(client)) return true
    if (this.isContributor(client)) return client.canAccessSocialListening
    return false
  }

  /** Create/manage Brand24 listening setups — Admin + Social Analyst only. */
  canManageSocialListeningSetup(client: AuthenticatedClient): boolean {
    const orgSubscribed = Boolean(client.organization?.isSocialListeningSubscriber)
    if (!orgSubscribed) return false
    return this.isAdmin(client) || this.isSocialAnalyst(client)
  }

  /** @deprecated Prefer canManageSocialListeningSetup for setup; canViewSocialListening for export */
  canCreateSocialListeningReports(client: AuthenticatedClient): boolean {
    return this.canManageSocialListeningSetup(client)
  }

  canUseSocialListening(client: AuthenticatedClient): boolean {
    return this.canViewSocialListening(client)
  }

  canAccessGetHelp(client: AuthenticatedClient): boolean {
    if (this.isAdmin(client)) return true
    if (!this.isContributor(client)) return false
    return client.canAccessGetHelp
  }

  canAccessActivity(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  canAccessOverview(client: AuthenticatedClient): boolean {
    return this.isAdmin(client)
  }

  filterOrgTeamForViewer<T extends { clientOrgRole: ClientOrgRole | null }>(
    client: AuthenticatedClient,
    members: T[],
  ): T[] {
    if (this.isAdmin(client)) return members
    return []
  }

  assertCanUpdateTeamMember(
    client: AuthenticatedClient,
    target: { clientOrgRole: ClientOrgRole | null; id?: string },
    dto: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean; canAccessGetHelp?: boolean },
  ): void {
    if (!this.isAdmin(client)) {
      throw new ForbiddenException('Only organization admins can manage team roles')
    }

    if (
      dto.clientOrgRole !== undefined &&
      dto.clientOrgRole !== ClientOrgRole.ADMIN &&
      dto.clientOrgRole !== ClientOrgRole.CONTRIBUTOR &&
      dto.clientOrgRole !== ClientOrgRole.VIEWER &&
      dto.clientOrgRole !== ClientOrgRole.SOCIAL_ANALYST
    ) {
      throw new ForbiddenException('Invalid organization role')
    }
  }

  /** @deprecated use assertCanUpdateTeamMember */
  assertPmCanUpdateTeamMember(
    client: AuthenticatedClient,
    target: { clientOrgRole: ClientOrgRole | null },
    dto: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean; canAccessGetHelp?: boolean },
  ): void {
    this.assertCanUpdateTeamMember(client, target, dto)
  }

  accessibleProjectsWhere(client: AuthenticatedClient): Prisma.ClientProjectWhereInput {
    const organizationId = this.requireOrganizationId(client)

    if (this.isSocialAnalyst(client)) {
      return { organizationId, id: '__none__' }
    }

    if (this.isAdmin(client)) {
      return { organizationId }
    }

    // Contributor + Viewer: assigned projects only
    return {
      organizationId,
      members: { some: { userId: client.id } },
    }
  }

  async listAccessibleProjectIds(client: AuthenticatedClient): Promise<string[]> {
    const rows = await this.prisma.clientProject.findMany({
      where: this.accessibleProjectsWhere(client),
      select: { id: true },
    })
    return rows.map((row) => row.id)
  }

  async assertCanCreateProject(client: AuthenticatedClient): Promise<void> {
    if (!this.canCreateProject(client)) {
      throw new ForbiddenException('Only organization admins can create projects')
    }
  }

  private async loadProject(projectId: string) {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,
        ownerUserId: true,
      },
    })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  async resolveProjectCapability(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<{
    id: string
    organizationId: string
    createdByUserId: string
    ownerUserId: string
    capability: ProjectCapability | null
    isOwner: boolean
  }> {
    const project = await this.loadProject(projectId)
    const orgId = this.requireOrganizationId(client)
    if (project.organizationId !== orgId) {
      return { ...project, capability: null, isOwner: false }
    }

    if (this.isSocialAnalyst(client)) {
      return { ...project, capability: null, isOwner: false }
    }

    const isOwner = project.ownerUserId === client.id

    if (this.isAdmin(client)) {
      return {
        ...project,
        capability: isOwner ? 'owner' : 'write',
        isOwner,
      }
    }

    const membership = await this.prisma.clientProjectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: client.id },
      },
      select: { userId: true },
    })
    if (!membership) {
      return { ...project, capability: null, isOwner: false }
    }

    if (this.isViewer(client)) {
      return { ...project, capability: 'read', isOwner: false }
    }

    // Contributor
    return { ...project, capability: 'write', isOwner: false }
  }

  async assertProjectAccess(
    client: AuthenticatedClient,
    projectId: string,
    required: ProjectCapability | 'VIEW' | 'MANAGE' = 'read',
  ): Promise<{
    id: string
    organizationId: string
    createdByUserId: string
    ownerUserId: string
    access: 'VIEW' | 'MANAGE'
    capability: ProjectCapability
    isOwner: boolean
  }> {
    // Back-compat: old VIEW/MANAGE map onto read/write
    const needed: ProjectCapability =
      required === 'VIEW'
        ? 'read'
        : required === 'MANAGE'
          ? 'write'
          : required

    const resolved = await this.resolveProjectCapability(client, projectId)
    if (!resolved.capability) {
      throw new ForbiddenException('You do not have access to this project')
    }

    const rank: Record<ProjectCapability, number> = {
      read: 1,
      write: 2,
      owner: 3,
    }
    if (rank[resolved.capability] < rank[needed]) {
      throw new ForbiddenException('You do not have access to this project')
    }

    // Viewers never get write even if somehow required was read-mapped wrong
    if (this.isViewer(client) && needed !== 'read') {
      throw new ForbiddenException('Viewers have read-only access')
    }

    return {
      id: resolved.id,
      organizationId: resolved.organizationId,
      createdByUserId: resolved.createdByUserId,
      ownerUserId: resolved.ownerUserId,
      capability: resolved.capability,
      isOwner: resolved.isOwner,
      access: resolved.capability === 'read' ? 'VIEW' : 'MANAGE',
    }
  }

  async assertCanSendProjectMessage(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<void> {
    if (!this.canSendMessages(client)) {
      throw new ForbiddenException('You cannot send messages')
    }
    await this.assertProjectAccess(client, projectId, 'write')
  }

  async assertCanAssignToProject(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<{ ownerUserId: string }> {
    const project = await this.loadProject(projectId)
    const orgId = this.requireOrganizationId(client)
    if (project.organizationId !== orgId) {
      throw new ForbiddenException('You do not have access to this project')
    }
    if (!this.isAdmin(client) || project.ownerUserId !== client.id) {
      throw new ForbiddenException(
        'Only the project owner can assign people — transfer ownership or ask CoCreate.',
      )
    }
    return { ownerUserId: project.ownerUserId }
  }

  async assertCanTransferOwnership(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<void> {
    const project = await this.loadProject(projectId)
    const orgId = this.requireOrganizationId(client)
    if (project.organizationId !== orgId || !this.isAdmin(client)) {
      throw new ForbiddenException('You cannot transfer this project')
    }
    if (project.ownerUserId !== client.id) {
      throw new ForbiddenException('Only the project owner can transfer ownership')
    }
  }

  async assertAdminCanBeDemoted(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const adminCount = await this.prisma.clientOrganizationMembership.count({
      where: {
        organizationId,
        clientOrgRole: ClientOrgRole.ADMIN,
        status: { not: UserStatus.SUSPENDED },
      },
    })
    if (adminCount <= 1) {
      throw new BadRequestException('Organizations need at least one Admin')
    }

    const owned = await this.prisma.clientProject.count({
      where: {
        organizationId,
        ownerUserId: userId,
        deletedAt: null,
      },
    })
    if (owned > 0) {
      throw new BadRequestException(
        `Transfer ownership of ${owned} project${owned === 1 ? '' : 's'} first`,
      )
    }
  }

  async canManageProjectMembership(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<boolean> {
    try {
      await this.assertCanAssignToProject(client, projectId)
      return true
    } catch {
      return false
    }
  }

  async assertCanManageProjectMembership(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<void> {
    await this.assertCanAssignToProject(client, projectId)
  }

  buildPortalPermissions(client: AuthenticatedClient) {
    return {
      canManageOrgTeam: this.canManageOrgTeam(client),
      canAccessTeamHub: this.canAccessTeamHub(client),
      canManageOrgRoles: this.canManageOrgRoles(client),
      canInviteOrgMemberImmediately: this.canInviteOrgMemberImmediately(client),
      canRequestOrgInvite: this.canRequestOrgInvite(client),
      canToggleSocialListeningForTeam: this.canToggleSocialListeningForTeam(client),
      canCreateProject: this.canCreateProject(client),
      canUseSocialListening: this.canUseSocialListening(client),
      canViewSocialListening: this.canViewSocialListening(client),
      canManageSocialListeningSetup: this.canManageSocialListeningSetup(client),
      canCreateSocialListeningReports: this.canCreateSocialListeningReports(client),
      canSendMessages: this.canSendMessages(client),
      canReactToFiles: this.canReactToFiles(client),
      canAccessGetHelp: this.canAccessGetHelp(client),
      canAccessActivity: this.canAccessActivity(client),
      canAccessOverview: this.canAccessOverview(client),
      canPromoteToAdmin: this.canPromoteToAdmin(client),
      isAdmin: this.isAdmin(client),
      isContributor: this.isContributor(client),
      isViewer: this.isViewer(client),
      isSocialAnalyst: this.isSocialAnalyst(client),
    }
  }
}
