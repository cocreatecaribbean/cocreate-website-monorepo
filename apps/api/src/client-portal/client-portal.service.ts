import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ClientPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  async validateLogin(email: string) {
    const normalized = this.normalizeEmail(email)
    const user = await this.prisma.clientPortalUser.findUnique({
      where: { email: normalized },
    })

    if (!user || !user.isActive) {
      return {
        ok: false as const,
        message:
          'This email does not have client portal access. Contact CoCreate if you need help.',
      }
    }

    const portalBase =
      process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
    const redirectUrl = `${portalBase}/login?email=${encodeURIComponent(normalized)}`

    return { ok: true as const, redirectUrl }
  }

  async listUsers() {
    return this.prisma.clientPortalUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async assignUser(email: string) {
    const normalized = this.normalizeEmail(email)
    return this.prisma.clientPortalUser.upsert({
      where: { email: normalized },
      create: { email: normalized, isActive: true },
      update: { isActive: true },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async deactivateUser(id: string) {
    return this.prisma.clientPortalUser.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }
}
