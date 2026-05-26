import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole, UserStatus } from '@cocreate/database'
import { isAgencyAdminRole, isSuperAdminRole } from '../auth/admin-roles'
import type { AuthenticatedAdmin } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'

export type AdminRosterItem = {
  id: string
  email: string
  role: UserRole
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

  private assertSuperAdmin(actor: AuthenticatedAdmin) {
    if (!isSuperAdminRole(actor.role)) {
      throw new ForbiddenException('Super admin access required')
    }
  }

  private agencyAdminWhere() {
    return {
      role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRole[] },
    }
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  async listAdmins(): Promise<AdminRosterItem[]> {
    const users = await this.prisma.user.findMany({
      where: this.agencyAdminWhere(),
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    })
    return users.map((u) => this.toRosterItem(u))
  }

  async inviteAdmin(
    actor: AuthenticatedAdmin,
    email: string,
  ): Promise<{
    admin: AdminRosterItem
    message: string
    devSignInUrl?: string
  }> {
    this.assertSuperAdmin(actor)

    const normalized = this.normalizeEmail(email)
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } })

    if (existing) {
      if (!isAgencyAdminRole(existing.role)) {
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

    const rosterItem = this.toRosterItem(admin)

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

  async suspendAdmin(actor: AuthenticatedAdmin, userId: string): Promise<AdminRosterItem> {
    this.assertSuperAdmin(actor)

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !isAgencyAdminRole(user.role)) {
      throw new NotFoundException('Admin user not found')
    }

    if (isSuperAdminRole(user.role)) {
      await this.assertNotLastSuperAdmin(user.id)
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    })

    return this.toRosterItem(updated)
  }

  async updateAdminRole(
    actor: AuthenticatedAdmin,
    userId: string,
    role: UserRole,
  ): Promise<AdminRosterItem> {
    this.assertSuperAdmin(actor)

    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
      throw new BadRequestException('Role must be SUPER_ADMIN or ADMIN')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !isAgencyAdminRole(user.role)) {
      throw new NotFoundException('Admin user not found')
    }

    if (isSuperAdminRole(user.role) && role === UserRole.ADMIN) {
      await this.assertNotLastSuperAdmin(user.id)
      if (user.id === actor.id) {
        throw new BadRequestException(
          'You cannot demote yourself while you are the only super admin',
        )
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    return this.toRosterItem(updated)
  }

  private async assertNotLastSuperAdmin(excludeUserId?: string) {
    const count = await this.prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        status: { not: UserStatus.SUSPENDED },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    })
    if (count === 0) {
      throw new BadRequestException('At least one active super admin is required')
    }
  }

  private toRosterItem(user: {
    id: string
    email: string
    role: UserRole
    status: UserStatus
    createdAt: Date
    updatedAt: Date
  }): AdminRosterItem {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
