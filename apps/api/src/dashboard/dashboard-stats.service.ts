import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  ClientProjectStatus,
  ProjectMessageKind,
  ProjectRequestType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import type { AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'

export type ClientDashboardStats = {
  activeProjects: number
  activeProjectsAwaitingReview: number
  pendingApprovals: number
  sharedFiles: number
  lastSharedFileAt: string | null
}

export type AdminDashboardStats = {
  activeClients: number
  activeClientsThisMonth: number
  openProjects: number
  projectsAwaitingApproval: number
  portalInvites: number
  socialListeningSubscribers: number
  socialListeningConfigured: number
}

const pendingCheckpointMessageWhere = {
  messageKind: ProjectMessageKind.CHECKPOINT,
  requiresClientApproval: true,
  supersededAt: null,
  clientApprovedAt: null,
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

    const pendingCheckpointOnProject = {
      requests: {
        some: {
          type: ProjectRequestType.PROGRESS,
          messages: { some: pendingCheckpointMessageWhere },
        },
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
          ...pendingCheckpointOnProject,
        },
      }),
      this.prisma.projectRequestMessage.count({
        where: {
          ...pendingCheckpointMessageWhere,
          request: {
            type: ProjectRequestType.PROGRESS,
            project: accessibleProjects,
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
    ])

    return {
      activeProjects,
      activeProjectsAwaitingReview,
      pendingApprovals,
      sharedFiles,
      lastSharedFileAt: lastAttachment?.createdAt.toISOString() ?? null,
    }
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
    }
  }
}
