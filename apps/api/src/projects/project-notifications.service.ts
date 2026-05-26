import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  PortalNotificationType,
  UserRole,
  UserStatus,
} from '@cocreate/database'
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
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
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
      where: { role: UserRole.ADMIN, status: { not: UserStatus.SUSPENDED } },
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
}
