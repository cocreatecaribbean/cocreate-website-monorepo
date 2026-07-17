import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  PortalNotificationType,
  Prisma,
  ProjectRequestStatus,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import { isAgencyAdminRole } from '../auth/admin-roles'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { serializeNotification } from './projects.serializer'

@Injectable()
export class ProjectNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: ProjectNotificationMailService,
  ) {}

  private adminCenterUrl() {
    return (
      this.config.get<string>('ADMIN_CENTER_URL')?.trim() ||
      'http://localhost:3002'
    )
  }

  clientPortalUrl() {
    return (
      this.config.get<string>('CLIENT_PORTAL_URL')?.trim() ||
      'http://localhost:3003'
    )
  }

  private async adminNotifyEmails(): Promise<string[]> {
    const configured = this.config.get<string>('ADMIN_NOTIFY_EMAIL')?.trim()
    if (configured) {
      return configured.split(',').map((e) => e.trim()).filter(Boolean)
    }
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        status: UserStatus.ACTIVE,
      },
      select: { email: true },
    })
    return admins.map((a) => a.email)
  }

  private async activeClientUserIds(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true },
    })
    return users
  }

  async notifyAdmins(params: {
    organizationId: string
    type: PortalNotificationType
    title: string
    body: string
    href?: string
    projectId?: string
    requestId?: string
    email?: {
      subject: string
      html: string
      text: string
      actionLink?: string
    }
  }) {
    const adminIds = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        status: { not: UserStatus.SUSPENDED },
      },
      select: { id: true },
    })

    if (adminIds.length > 0) {
      await this.prisma.portalNotification.createMany({
        data: adminIds.map((admin) => ({
          userId: admin.id,
          organizationId: params.organizationId,
          type: params.type,
          title: params.title,
          body: params.body,
          href: params.href ?? null,
          projectId: params.projectId ?? null,
          requestId: params.requestId ?? null,
        })),
      })
    }

    if (params.email) {
      const emails = await this.adminNotifyEmails()
      await this.mail.send({
        to: emails,
        subject: params.email.subject,
        html: params.email.html,
        text: params.email.text,
        actionLink: params.email.actionLink,
      })
    }
  }

  async notifyOrgClients(params: {
    organizationId: string
    type: PortalNotificationType
    title: string
    body: string
    href?: string
    projectId?: string
    requestId?: string
    email?: {
      subject: string
      html: string
      text: string
      actionLink?: string
    }
  }) {
    const clients = await this.activeClientUserIds(params.organizationId)
    if (clients.length === 0) return

    await this.notifyClientUsers({
      organizationId: params.organizationId,
      userIds: clients.map((c) => c.id),
      type: params.type,
      title: params.title,
      body: params.body,
      href: params.href,
      projectId: params.projectId,
      requestId: params.requestId,
      email: params.email,
    })
  }

  async notifyClientUsers(params: {
    organizationId: string
    userIds: string[]
    type: PortalNotificationType
    title: string
    body: string
    href?: string
    projectId?: string
    requestId?: string
    email?: {
      subject: string
      html: string
      text: string
      actionLink?: string
    }
  }) {
    if (params.userIds.length === 0) return

    const clients = await this.prisma.user.findMany({
      where: {
        id: { in: params.userIds },
        role: UserRole.CLIENT,
        organizationMemberships: {
          some: {
            organizationId: params.organizationId,
            status: { not: UserStatus.SUSPENDED },
          },
        },
      },
      select: { id: true, email: true },
    })
    if (clients.length === 0) return

    await this.prisma.portalNotification.createMany({
      data: clients.map((client) => ({
        userId: client.id,
        organizationId: params.organizationId,
        type: params.type,
        title: params.title,
        body: params.body,
        href: params.href ?? null,
        projectId: params.projectId ?? null,
        requestId: params.requestId ?? null,
      })),
    })

    if (params.email) {
      await this.mail.send({
        to: clients.map((c) => c.email),
        subject: params.email.subject,
        html: params.email.html,
        text: params.email.text,
        actionLink: params.email.actionLink,
      })
    }
  }

  adminClientWorkspaceLink(organizationId: string) {
    return `${this.adminCenterUrl()}/clients/${organizationId}`
  }

  clientProjectLink(projectId: string) {
    return `${this.clientPortalUrl()}/?ccView=projects&projectId=${projectId}`
  }

  clientAttentionLink() {
    return `${this.clientPortalUrl()}/attention`
  }

  async listForUser(userId: string, unreadOnly?: boolean) {
    const rows = await this.prisma.portalNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return rows.map(serializeNotification)
  }

  async markRead(userId: string, notificationId: string) {
    const row = await this.prisma.portalNotification.findFirst({
      where: { id: notificationId, userId },
    })
    if (!row) return null
    const updated = await this.prisma.portalNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    })
    return serializeNotification(updated)
  }

  async unreadCount(userId: string) {
    return this.prisma.portalNotification.count({
      where: { userId, readAt: null },
    })
  }

  private static readonly openInboxRequestStatuses: ProjectRequestStatus[] = [
    ProjectRequestStatus.OPEN,
    ProjectRequestStatus.IN_PROGRESS,
  ]

  private inboxUnreadWhere(
    adminUserId: string,
    organizationId: string,
  ): Prisma.PortalNotificationWhereInput {
    const openStatuses = ProjectNotificationsService.openInboxRequestStatuses
    return {
      userId: adminUserId,
      organizationId,
      readAt: null,
      OR: [
        {
          requestId: { not: null },
          request: {
            status: { in: openStatuses },
            project: { organizationId },
          },
        },
        {
          requestId: null,
          projectId: { not: null },
          project: {
            organizationId,
            requests: {
              some: { status: { in: openStatuses } },
            },
          },
        },
      ],
    }
  }

  async unreadInboxCountForAdmin(adminUserId: string, organizationId: string) {
    return this.prisma.portalNotification.count({
      where: this.inboxUnreadWhere(adminUserId, organizationId),
    })
  }

  async markInboxReadForRequest(
    adminUserId: string,
    organizationId: string,
    requestId: string,
  ) {
    const request = await this.prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        project: { organizationId },
      },
      select: { id: true },
    })
    if (!request) return { count: 0 }

    const result = await this.prisma.portalNotification.updateMany({
      where: {
        userId: adminUserId,
        organizationId,
        readAt: null,
        requestId,
      },
      data: { readAt: new Date() },
    })
    return { count: result.count }
  }

  async markAllInboxReadForOrg(adminUserId: string, organizationId: string) {
    const result = await this.prisma.portalNotification.updateMany({
      where: this.inboxUnreadWhere(adminUserId, organizationId),
      data: { readAt: new Date() },
    })
    return { count: result.count }
  }

  private clientAttentionUnreadWhere(
    userId: string,
    organizationId: string,
    accessibleProjects: Prisma.ClientProjectWhereInput,
  ): Prisma.PortalNotificationWhereInput {
    const openStatuses = ProjectNotificationsService.openInboxRequestStatuses
    return {
      userId,
      organizationId,
      readAt: null,
      OR: [
        {
          type: PortalNotificationType.REQUEST_MESSAGE,
          requestId: { not: null },
          request: {
            status: { in: openStatuses },
            project: accessibleProjects,
          },
        },
        {
          type: {
            in: [
              PortalNotificationType.PROJECT_APPROVED,
              PortalNotificationType.REQUEST_RESOLVED,
              PortalNotificationType.CANCELLATION_RESOLVED,
            ],
          },
          project: accessibleProjects,
        },
      ],
    }
  }

  async unreadAttentionCountForClient(
    userId: string,
    accessibleProjects: Prisma.ClientProjectWhereInput,
  ) {
    const organizationId =
      typeof accessibleProjects.organizationId === 'string'
        ? accessibleProjects.organizationId
        : undefined
    if (!organizationId) return 0

    return this.prisma.portalNotification.count({
      where: this.clientAttentionUnreadWhere(
        userId,
        organizationId,
        accessibleProjects,
      ),
    })
  }

  async listAttentionForClient(
    userId: string,
    accessibleProjects: Prisma.ClientProjectWhereInput,
  ) {
    const organizationId =
      typeof accessibleProjects.organizationId === 'string'
        ? accessibleProjects.organizationId
        : undefined
    if (!organizationId) return []

    const rows = await this.prisma.portalNotification.findMany({
      where: this.clientAttentionUnreadWhere(
        userId,
        organizationId,
        accessibleProjects,
      ),
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return rows.map(serializeNotification)
  }

  async markRequestNotificationsReadForClient(
    userId: string,
    organizationId: string,
    accessibleProjects: Prisma.ClientProjectWhereInput,
    requestId: string,
  ) {
    const request = await this.prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        project: accessibleProjects,
      },
      select: { id: true },
    })
    if (!request) return { count: 0 }

    const result = await this.prisma.portalNotification.updateMany({
      where: {
        userId,
        organizationId,
        readAt: null,
        requestId,
      },
      data: { readAt: new Date() },
    })
    return { count: result.count }
  }

  async markProjectNotificationsReadForClient(
    userId: string,
    accessibleProjects: Prisma.ClientProjectWhereInput,
    projectId: string,
  ) {
    const organizationId =
      typeof accessibleProjects.organizationId === 'string'
        ? accessibleProjects.organizationId
        : undefined
    if (!organizationId) return { count: 0 }

    const project = await this.prisma.clientProject.findFirst({
      where: { id: projectId, ...accessibleProjects },
      select: { id: true },
    })
    if (!project) return { count: 0 }

    const result = await this.prisma.portalNotification.updateMany({
      where: {
        userId,
        organizationId,
        readAt: null,
        projectId,
      },
      data: { readAt: new Date() },
    })
    return { count: result.count }
  }
}
