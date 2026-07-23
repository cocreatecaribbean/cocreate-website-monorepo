import { ForbiddenException, Injectable } from '@nestjs/common'
import { ClientProjectStatus, UserRole, UserStatus } from '@cocreate/database'
import type { AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import type { AdminDashboardStats as AdminDashboardStatsContract } from '@cocreate/api-contracts/v1/admin-portal'
import type { ClientDashboardStats as ClientDashboardStatsContract } from '@cocreate/api-contracts/v1/client-portal'
import { PrismaService } from '../prisma/prisma.service'

export type ClientDashboardStats = ClientDashboardStatsContract

export type AdminDashboardStats = AdminDashboardStatsContract

@Injectable()
export class DashboardStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientAccess: ClientAccessService,
  ) {}

  private requireOrgId(client: AuthenticatedClient): string {
    const orgId = client.organization?.id
    if (!orgId) throw new ForbiddenException('No organization linked to your account')
    return orgId
  }

  async getClientStats(client: AuthenticatedClient): Promise<ClientDashboardStats> {
    this.requireOrgId(client)
    const accessibleProjects = this.clientAccess.accessibleProjectsWhere(client)
    const topPickReactionKinds = ['LOVE_THIS', 'SHIP_IT', 'GREAT_DIRECTION'] as const
    const projectListLimit = 20

    const [
      activeProjects,
      topPicksCount,
      sharedFiles,
      lastAttachment,
      projects,
      topPickGroups,
    ] = await Promise.all([
      this.prisma.clientProject.count({
        where: { ...accessibleProjects, status: ClientProjectStatus.ACTIVE },
      }),
      this.prisma.projectAttachment.count({
        where: {
          project: accessibleProjects,
          reactions: {
            some: {
              kind: { in: [...topPickReactionKinds] },
            },
          },
        },
      }),
      this.prisma.projectAttachment.count({
        where: { project: accessibleProjects },
      }),
      this.prisma.projectAttachment.findFirst({
        where: { project: accessibleProjects },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.clientProject.findMany({
        where: accessibleProjects,
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              attachments: true,
            },
          },
        },
      }),
      this.prisma.projectAttachment.groupBy({
        by: ['projectId'],
        where: {
          project: accessibleProjects,
          reactions: {
            some: {
              kind: { in: [...topPickReactionKinds] },
            },
          },
        },
        _count: { _all: true },
      }),
    ])

    const titleById = new Map(projects.map((p) => [p.id, p.title]))

    const projectsWithTopPicks = topPickGroups
      .map((g) => ({
        id: g.projectId,
        title: titleById.get(g.projectId) ?? 'Project',
        count: g._count._all,
      }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, projectListLimit)

    const projectsWithSharedFiles = projects
      .map((p) => ({
        id: p.id,
        title: p.title,
        count: p._count.attachments,
      }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, projectListLimit)

    return {
      activeProjects,
      activeProjectsAwaitingReview: 0,
      topPicksCount,
      sharedFiles,
      lastSharedFileAt: lastAttachment?.createdAt.toISOString() ?? null,
      projectsWithTopPicks,
      projectsWithSharedFiles,
    } satisfies ClientDashboardStats
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const activeClientOrgWhere = {
      users: {
        some: {
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
        },
      },
    }

    const socialListeningBaseWhere = {
      isSocialListeningSubscriber: true,
      users: {
        some: {
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
        },
      },
    }

    const [
      activeClients,
      activeClientsThisMonth,
      openProjects,
      projectsAwaitingApproval,
      portalInvites,
      socialListeningSubscribers,
      socialListeningConfigured,
    ] = await Promise.all([
      this.prisma.organization.count({ where: activeClientOrgWhere }),
      this.prisma.organization.count({
        where: {
          ...activeClientOrgWhere,
          createdAt: { gte: monthStart },
        },
      }),
      this.prisma.clientProject.count({
        where: {
          status: {
            in: [
              ClientProjectStatus.SUBMITTED,
              ClientProjectStatus.ACTIVE,
              ClientProjectStatus.ON_HOLD,
            ],
          },
        },
      }),
      this.prisma.clientProject.count({
        where: { status: ClientProjectStatus.SUBMITTED },
      }),
      this.prisma.user.count({
        where: { role: UserRole.CLIENT, status: UserStatus.INVITED },
      }),
      this.prisma.organization.count({ where: socialListeningBaseWhere }),
      this.prisma.organization.count({
        where: {
          ...socialListeningBaseWhere,
          brand24ProjectId: { not: null },
        },
      }),
    ])

    return {
      activeClients,
      activeClientsThisMonth,
      openProjects,
      projectsAwaitingApproval,
      portalInvites,
      socialListeningSubscribers,
      socialListeningConfigured,
    } satisfies AdminDashboardStats
  }
}
