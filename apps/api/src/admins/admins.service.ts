import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole, UserStatus } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'

export type AdminRosterItem = {
  id: string
  email: string
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class AdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  async listAdmins(): Promise<AdminRosterItem[]> {
    const users = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: 'asc' },
    })
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))
  }

  async inviteAdmin(email: string): Promise<{
    admin: AdminRosterItem
    message: string
    devSignInUrl?: string
  }> {
    const normalized = this.normalizeEmail(email)
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } })

    if (existing) {
      if (existing.role !== UserRole.ADMIN) {
        throw new ConflictException(
          'This email is already registered as a client. Use a different email for admin access.',
        )
      }
      if (existing.status !== UserStatus.SUSPENDED) {
        throw new ConflictException('This admin email is already on the roster')
      }
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { status: UserStatus.INVITED },
      })
    }

    const admin = existing
      ? await this.prisma.user.findUniqueOrThrow({ where: { id: existing.id } })
      : await this.prisma.user.create({
          data: {
            email: normalized,
            role: UserRole.ADMIN,
            status: UserStatus.INVITED,
          },
        })

    const adminCenterUrl =
      this.config.get<string>('ADMIN_CENTER_URL') ?? 'http://localhost:3002'

    const result = await this.supabaseAuth.sendAllowlistedMagicLink(
      normalized,
      `${adminCenterUrl}/auth/callback`,
      { role: 'ADMIN' },
    )

    const rosterItem = {
      id: admin.id,
      email: admin.email,
      status: admin.status,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }

    if (result.status === 'dev_link' && result.devSignInUrl) {
      return {
        admin: rosterItem,
        message: 'Admin added. Open the dev sign-in link below (no email sent).',
        devSignInUrl: result.devSignInUrl,
      }
    }

    return {
      admin: rosterItem,
      message: 'Admin invited. They will receive a sign-in link by email.',
    }
  }

  async suspendAdmin(userId: string): Promise<AdminRosterItem> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== UserRole.ADMIN) {
      throw new NotFoundException('Admin user not found')
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    })

    return {
      id: updated.id,
      email: updated.email,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
  }
}
