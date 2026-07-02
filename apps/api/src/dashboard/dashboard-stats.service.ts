import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  ClientProjectStatus,
  PortalNotificationType,
  ProjectApprovalItemStatus,
  ProjectRequestType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import type { AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import type { AdminDashboardStats as AdminDashboardStatsContract } from '@cocreate/api-contracts/v1/admin-portal'
import type { ClientDashboardStats as ClientDashboardStatsContract } from '@cocreate/api-contracts/v1/client-portal'
import { PrismaService } from '../prisma/prisma.service'

export type ClientDashboardStats = ClientDashboardStatsContract

export type AdminDashboardStats = AdminDashboardStatsContract

const pendingApprovalItemWhere = {
  status: ProjectApprovalItemStatus.PENDING,
} as const

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
    const orgId = this.requireOrgId(client)
    const accessibleProjects = this.clientAccess.accessibleProjectsWhere(client)

    const pendingApprovalOnProject = {
      approvalItems: {
        some: pendingApprovalItemWhere,
      },
    }

    const [
      activeProjects,
      activeProjectsAwaitingReview,
      pendingApprovals,
      sharedFiles,
      lastAttachment,
    ] = await Promise.all([
      this.prisma.clientProject.count({
        where: { ...accessibleProjects, status: ClientProjectStatus.ACTIVE },
      }),
      this.prisma.clientProject.count({
        where: {
          ...accessibleProjects,
          status: ClientProjectStatus.ACTIVE,
          ...pendingApprovalOnProject,
        },
      }),
      this.prisma.projectApprovalItem.count({
        where: {
          ...pendingApprovalItemWhere,
          project: accessibleProjects,
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
    ])

    return {
      activeProjects,
      activeProjectsAwaitingReview,
      pendingApprovals,
      sharedFiles,
      lastSharedFileAt: lastAttachment?.createdAt.toISOString() ?? null,
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
