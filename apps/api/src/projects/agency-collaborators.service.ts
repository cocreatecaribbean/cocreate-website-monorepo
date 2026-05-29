import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UserRole, UserStatus } from '@cocreate/database'
import type { AuthenticatedAgencyUser } from '../auth/auth.service'
import { AgencyAccessService } from '../auth/agency-access.service'
import { isAgencyAdminRole, isCollaboratorRole } from '../auth/admin-roles'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AgencyCollaboratorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyAccess: AgencyAccessService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private adminCenterUrl() {
    return this.config.get<string>('ADMIN_CENTER_URL') ?? 'http://localhost:3002'
  }

  private assertCoreTeam(actor: AuthenticatedAgencyUser) {
    if (!this.agencyAccess.isCoreTeam(actor)) {
      throw new ForbiddenException('Core team access required')
    }
  }

  private serializeRosterItem(user: {
    id: string
    email: string
    status: UserStatus
    createdAt: Date
    agencyProjectMemberships: Array<{
      project: {
        id: string
        title: string
        organizationId: string
        organization: { name: string }
      }
    }>
  }) {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      projects: user.agencyProjectMemberships.map((m) => ({
        id: m.project.id,
        title: m.project.title,
        organizationId: m.project.organizationId,
        organizationName: m.project.organization.name,
      })),
    }
  }

  async listAll(actor: AuthenticatedAgencyUser) {
    this.assertCoreTeam(actor)

    const users = await this.prisma.user.findMany({
      where: { role: UserRole.COLLABORATOR },
      orderBy: { createdAt: 'asc' },
      include: {
        agencyProjectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                organizationId: true,
                organization: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    return users.map((user) => this.serializeRosterItem(user))
  }

  async listForProject(actor: AuthenticatedAgencyUser, projectId: string) {
    await this.agencyAccess.assertCanManageCollaborators(actor, projectId)

    const rows = await this.prisma.agencyProjectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, email: true, status: true, role: true } },
        grantedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.user.email,
      status: row.user.status,
      grantedByEmail: row.grantedBy.email,
      createdAt: row.createdAt.toISOString(),
    }))
  }

  private async assertEmailAvailableForCollaborator(
    existing: { id: string; role: UserRole } | null,
  ) {
    if (existing && isAgencyAdminRole(existing.role)) {
      throw new ConflictException(
        'This email belongs to a core team admin. Use a different email for collaborators.',
      )
    }

    if (existing && existing.role === UserRole.CLIENT) {
      throw new ConflictException(
        'This email is registered as a client contact. Use a different email.',
      )
    }
  }

  private async findOrCreateCollaboratorByEmail(email: string) {
    const normalized = this.normalizeEmail(email)
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    })

    await this.assertEmailAvailableForCollaborator(existing)

    if (existing?.role === UserRole.COLLABORATOR) {
      if (existing.status === UserStatus.SUSPENDED) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { status: UserStatus.INVITED },
        })
      }
      return existing
    }

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          role: UserRole.COLLABORATOR,
          status: UserStatus.INVITED,
          organizationId: null,
          clientOrgRole: null,
        },
      })
    }

    return this.prisma.user.create({
      data: {
        email: normalized,
        role: UserRole.COLLABORATOR,
        status: UserStatus.INVITED,
      },
    })
  }

  private async getCollaboratorUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !isCollaboratorRole(user.role)) {
      throw new NotFoundException('Collaborator not found')
    }
    return user
  }

  private async reactivateCollaboratorIfNeeded(userId: string) {
    const user = await this.getCollaboratorUser(userId)
    if (user.status === UserStatus.SUSPENDED) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.INVITED },
      })
    }
    return user
  }

  private async assignToProject(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    userId: string,
  ) {
    await this.agencyAccess.assertCanManageCollaborators(actor, projectId)

    await this.prisma.agencyProjectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      create: {
        projectId,
        userId,
        grantedByUserId: actor.id,
      },
      update: {},
    })
  }

  private async sendCollaboratorMagicLink(
    email: string,
    nextPath = '/collaborate',
  ) {
    return this.supabaseAuth.sendAllowlistedMagicLink(
      email,
      `${this.adminCenterUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      { role: 'COLLABORATOR' },
    )
  }

  async createFromRoster(
    actor: AuthenticatedAgencyUser,
    email: string,
    projectIds: string[] = [],
  ) {
    this.assertCoreTeam(actor)

    const collaborator = await this.findOrCreateCollaboratorByEmail(email)

    const uniqueProjectIds = [...new Set(projectIds.filter(Boolean))]
    for (const projectId of uniqueProjectIds) {
      await this.assignToProject(actor, projectId, collaborator.id)
    }

    const result = await this.sendCollaboratorMagicLink(collaborator.email)

    return {
      ok: true as const,
      collaborator: {
        userId: collaborator.id,
        email: collaborator.email,
        status: collaborator.status,
      },
      message:
        uniqueProjectIds.length > 0
          ? 'Collaborator invited and assigned to selected projects.'
          : 'Collaborator added to roster. Assign a project before they can sign in.',
      devSignInUrl: result.devSignInUrl,
    }
  }

  async assignExistingToProject(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    userId: string,
    options?: { sendInvite?: boolean },
  ) {
    await this.agencyAccess.assertCanManageCollaborators(actor, projectId)

    const collaborator = await this.reactivateCollaboratorIfNeeded(userId)
    await this.assignToProject(actor, projectId, collaborator.id)

    const shouldSendInvite =
      options?.sendInvite ?? collaborator.status === UserStatus.INVITED

    let devSignInUrl: string | undefined
    if (shouldSendInvite) {
      const result = await this.sendCollaboratorMagicLink(
        collaborator.email,
        `/collaborate/projects/${projectId}`,
      )
      devSignInUrl = result.devSignInUrl
    }

    return {
      ok: true as const,
      collaborator: {
        userId: collaborator.id,
        email: collaborator.email,
        status: collaborator.status,
      },
      message: shouldSendInvite
        ? 'Collaborator assigned and sign-in link sent.'
        : 'Collaborator assigned to this project.',
      devSignInUrl,
    }
  }

  async inviteToProject(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    input: { email?: string; userId?: string },
  ) {
    const hasEmail = Boolean(input.email?.trim())
    const hasUserId = Boolean(input.userId?.trim())

    if (hasEmail === hasUserId) {
      throw new BadRequestException('Provide exactly one of email or userId')
    }

    if (input.userId) {
      return this.assignExistingToProject(actor, projectId, input.userId, {
        sendInvite: true,
      })
    }

    await this.agencyAccess.assertCanManageCollaborators(actor, projectId)

    const collaborator = await this.findOrCreateCollaboratorByEmail(input.email!)
    await this.assignToProject(actor, projectId, collaborator.id)

    const result = await this.sendCollaboratorMagicLink(
      collaborator.email,
      `/collaborate/projects/${projectId}`,
    )

    return {
      ok: true as const,
      collaborator: {
        userId: collaborator.id,
        email: collaborator.email,
        status: collaborator.status,
      },
      message: 'Collaborator invited. They will receive a sign-in link by email.',
      devSignInUrl: result.devSignInUrl,
    }
  }

  async resendInvite(actor: AuthenticatedAgencyUser, userId: string) {
    this.assertCoreTeam(actor)

    const collaborator = await this.getCollaboratorUser(userId)
    if (collaborator.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('Collaborator is suspended. Assign to a project first.')
    }

    const membership = await this.prisma.agencyProjectMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    if (!membership) {
      throw new BadRequestException(
        'Collaborator has no project access. Assign a project before sending an invite.',
      )
    }

    const nextPath =
      membership.projectId != null
        ? `/collaborate/projects/${membership.projectId}`
        : '/collaborate'

    const result = await this.sendCollaboratorMagicLink(collaborator.email, nextPath)

    return {
      ok: true as const,
      message: 'Sign-in link sent.',
      devSignInUrl: result.devSignInUrl,
    }
  }

  async removeFromProject(
    actor: AuthenticatedAgencyUser,
    projectId: string,
    userId: string,
  ) {
    await this.agencyAccess.assertCanManageCollaborators(actor, projectId)

    await this.prisma.agencyProjectMember.deleteMany({
      where: { projectId, userId },
    })

    const remaining = await this.prisma.agencyProjectMember.count({
      where: { userId },
    })
    if (remaining === 0) {
      await this.prisma.user.updateMany({
        where: { id: userId, role: UserRole.COLLABORATOR },
        data: { status: UserStatus.SUSPENDED },
      })
    }

    return { ok: true as const }
  }

  async removeFromAgency(actor: AuthenticatedAgencyUser, userId: string) {
    this.assertCoreTeam(actor)

    await this.getCollaboratorUser(userId)

    await this.prisma.agencyProjectMember.deleteMany({
      where: { userId },
    })

    await this.prisma.user.updateMany({
      where: { id: userId, role: UserRole.COLLABORATOR },
      data: { status: UserStatus.SUSPENDED },
    })

    return { ok: true as const }
  }
}
