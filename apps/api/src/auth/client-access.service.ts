import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClientOrgRole,
  ClientProjectAccessLevel,
  type Prisma,
} from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedClient } from './auth.service'

export type ProjectAccessLevel = 'VIEW' | 'MANAGE'

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

  isOwner(client: AuthenticatedClient): boolean {
    return client.clientOrgRole === ClientOrgRole.OWNER
  }

  isProjectManager(client: AuthenticatedClient): boolean {
    return client.clientOrgRole === ClientOrgRole.PROJECT_MANAGER
  }

  canCreateProject(client: AuthenticatedClient): boolean {
    return (
      this.isOwner(client) || client.clientOrgRole === ClientOrgRole.PROJECT_MANAGER
    )
  }

  canManageOrgTeam(client: AuthenticatedClient): boolean {
    return this.isOwner(client)
  }

  canAccessTeamHub(client: AuthenticatedClient): boolean {
    return this.isOwner(client) || this.isProjectManager(client)
  }

  canManageOrgRoles(client: AuthenticatedClient): boolean {
    return this.canAccessTeamHub(client)
  }

  canInviteOrgMemberImmediately(client: AuthenticatedClient): boolean {
    return this.isOwner(client)
  }

  canRequestOrgInvite(client: AuthenticatedClient): boolean {
    return this.isProjectManager(client)
  }

  canToggleSocialListeningForTeam(client: AuthenticatedClient): boolean {
    return this.isOwner(client)
  }

  canPmManageTargetMember(
    client: AuthenticatedClient,
    target: { clientOrgRole: ClientOrgRole | null },
  ): boolean {
    if (!this.isProjectManager(client)) return false
    return target.clientOrgRole !== ClientOrgRole.OWNER
  }

  filterOrgTeamForViewer<T extends { clientOrgRole: ClientOrgRole | null }>(
    client: AuthenticatedClient,
    members: T[],
  ): T[] {
    if (this.isOwner(client)) return members
    if (this.isProjectManager(client)) {
      return members.filter((m) => m.clientOrgRole !== ClientOrgRole.OWNER)
    }
    return []
  }

  assertPmCanUpdateTeamMember(
    client: AuthenticatedClient,
    target: { clientOrgRole: ClientOrgRole | null },
    dto: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean },
  ): void {
    if (this.isOwner(client)) return

    if (!this.isProjectManager(client)) {
      throw new ForbiddenException('You cannot manage organization roles')
    }

    if (target.clientOrgRole === ClientOrgRole.OWNER) {
      throw new ForbiddenException('Cannot change the organization owner role')
    }

    if (dto.clientOrgRole === ClientOrgRole.OWNER) {
      throw new ForbiddenException('Cannot assign organization owner role')
    }

    if (dto.canAccessSocialListening !== undefined) {
      throw new ForbiddenException(
        'Only the organization owner can change social listening access',
      )
    }

    if (
      dto.clientOrgRole !== undefined &&
      dto.clientOrgRole !== ClientOrgRole.PROJECT_MANAGER &&
      dto.clientOrgRole !== ClientOrgRole.MEMBER
    ) {
      throw new ForbiddenException('Invalid role for project manager to assign')
    }
  }

  canUseSocialListening(client: AuthenticatedClient): boolean {
    const orgSubscribed = Boolean(client.organization?.isSocialListeningSubscriber)
    if (!orgSubscribed) return false
    if (this.isOwner(client)) return true
    return client.canAccessSocialListening
  }

  /** Prisma filter for projects visible to this client */
  accessibleProjectsWhere(client: AuthenticatedClient): Prisma.ClientProjectWhereInput {
    const organizationId = this.requireOrganizationId(client)

    if (this.isOwner(client)) {
      return { organizationId }
    }

    if (client.clientOrgRole === ClientOrgRole.PROJECT_MANAGER) {
      return {
        organizationId,
        OR: [
          { createdByUserId: client.id },
          { members: { some: { userId: client.id } } },
        ],
      }
    }

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
      throw new ForbiddenException(
        'Only organization owners and project managers can create projects',
      )
    }
  }

  private async resolveProjectAccess(
    client: AuthenticatedClient,
    project: {
      id: string
      organizationId: string
      createdByUserId: string
    },
  ): Promise<ProjectAccessLevel | null> {
    const orgId = this.requireOrganizationId(client)
    if (project.organizationId !== orgId) return null

    if (this.isOwner(client)) return 'MANAGE'

    if (project.createdByUserId === client.id) {
      return 'MANAGE'
    }

    const membership = await this.prisma.clientProjectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: client.id },
      },
      select: { access: true },
    })

    if (!membership) return null
    return membership.access === ClientProjectAccessLevel.MANAGE ? 'MANAGE' : 'VIEW'
  }

  private levelSatisfies(
    actual: ProjectAccessLevel,
    required: ProjectAccessLevel,
  ): boolean {
    if (required === 'VIEW') return actual === 'VIEW' || actual === 'MANAGE'
    return actual === 'MANAGE'
  }

  async assertProjectAccess(
    client: AuthenticatedClient,
    projectId: string,
    required: ProjectAccessLevel = 'VIEW',
  ): Promise<{
    id: string
    organizationId: string
    createdByUserId: string
    access: ProjectAccessLevel
  }> {
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,
      },
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    const access = await this.resolveProjectAccess(client, project)
    if (!access || !this.levelSatisfies(access, required)) {
      throw new ForbiddenException('You do not have access to this project')
    }

    return { ...project, access }
  }

  async canManageProjectMembership(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<boolean> {
    try {
      await this.assertProjectAccess(client, projectId, 'MANAGE')
      return true
    } catch {
      return false
    }
  }

  async assertCanManageProjectMembership(
    client: AuthenticatedClient,
    projectId: string,
  ): Promise<void> {
    await this.assertProjectAccess(client, projectId, 'MANAGE')
  }
}
