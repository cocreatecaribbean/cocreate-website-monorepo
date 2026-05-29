import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { UserRole, type Prisma } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedAgencyUser } from './auth.service'
import { isAgencyAdminRole } from './admin-roles'

@Injectable()
export class AgencyAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isCoreTeam(actor: AuthenticatedAgencyUser): boolean {
    return isAgencyAdminRole(actor.role)
  }

  async listAccessibleProjectIds(actor: AuthenticatedAgencyUser): Promise<string[] | 'all'> {
    if (this.isCoreTeam(actor)) {
      return 'all'
    }

    const rows = await this.prisma.agencyProjectMember.findMany({
      where: { userId: actor.id },
      select: { projectId: true },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => row.projectId)
  }

  async accessibleProjectsWhere(
    actor: AuthenticatedAgencyUser,
  ): Promise<Prisma.ClientProjectWhereInput> {
    const ids = await this.listAccessibleProjectIds(actor)
    if (ids === 'all') {
      return {}
    }
    if (ids.length === 0) {
      return { id: { in: [] } }
    }
    return { id: { in: ids } }
  }

  async assertCanAccessProject(
    actor: AuthenticatedAgencyUser,
    projectId: string,
  ): Promise<void> {
    if (this.isCoreTeam(actor)) {
      const exists = await this.prisma.clientProject.findUnique({
        where: { id: projectId },
        select: { id: true },
      })
      if (!exists) throw new NotFoundException('Project not found')
      return
    }

    const membership = await this.prisma.agencyProjectMember.findUnique({
      where: { projectId_userId: { projectId, userId: actor.id } },
    })
    if (!membership) {
      throw new ForbiddenException('You do not have access to this project')
    }
  }

  async assertCanManageCollaborators(
    actor: AuthenticatedAgencyUser,
    projectId: string,
  ): Promise<void> {
    if (!this.isCoreTeam(actor)) {
      throw new ForbiddenException('Only core team members can manage collaborators')
    }
    await this.assertCanAccessProject(actor, projectId)
  }

  async assertCanPostToRequest(
    actor: AuthenticatedAgencyUser,
    requestType: string,
  ): Promise<void> {
    if (this.isCoreTeam(actor)) return

    if (requestType === 'INTERNAL') return

    throw new ForbiddenException('You can only post in the team review thread')
  }

  canReadRequest(actor: AuthenticatedAgencyUser, requestType: string): boolean {
    if (this.isCoreTeam(actor)) return true
    return requestType === 'INTERNAL' || requestType === 'PROGRESS'
  }
}
