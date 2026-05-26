import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole, UserStatus } from '@cocreate/database'
import { isAgencyAdminRole } from './admin-roles'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { PrismaService } from '../prisma/prisma.service'

export type AuthenticatedAdmin = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  supabaseAuthId: string | null
}

export type AuthenticatedClient = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  supabaseAuthId: string | null
  organization: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isSocialListeningSubscriber: boolean
  } | null
}

@Injectable()
export class AuthService {
  private readonly adminClient: SupabaseClient
  private readonly publicClient: SupabaseClient | null

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL')
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY')

    if (url && serviceKey) {
      this.adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    } else {
      this.adminClient = null as unknown as SupabaseClient
    }

    this.publicClient =
      url && anonKey
        ? createClient(url, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null
  }

  get isSupabaseConfigured(): boolean {
    return Boolean(this.adminClient)
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  async getSupabaseUserFromToken(accessToken: string) {
    if (!this.adminClient) {
      throw new UnauthorizedException('Supabase Auth is not configured')
    }

    const { data, error } = await this.adminClient.auth.getUser(accessToken)
    if (error || !data.user?.email) {
      throw new UnauthorizedException('Invalid or expired session')
    }

    return data.user
  }

  async requireAdmin(accessToken: string): Promise<AuthenticatedAdmin> {
    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)

    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || !isAgencyAdminRole(user.role)) {
      throw new ForbiddenException('Admin access required')
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Admin account is suspended')
    }

    if (user.supabaseAuthId !== authUser.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          supabaseAuthId: authUser.id,
          status:
            user.status === UserStatus.INVITED
              ? UserStatus.ACTIVE
              : user.status,
        },
      })
    } else if (user.status === UserStatus.INVITED) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE },
      })
    }

    const refreshed = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    })

    return {
      id: refreshed.id,
      email: refreshed.email,
      role: refreshed.role,
      status: refreshed.status,
      supabaseAuthId: refreshed.supabaseAuthId,
    }
  }

  private mapClientOrganization(
    organization: {
      id: string
      name: string
      slug: string
      logoUrl: string | null
      isSocialListeningSubscriber: boolean
    } | null,
  ) {
    if (!organization) return null
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
      isSocialListeningSubscriber: organization.isSocialListeningSubscriber,
    }
  }

  private async loadClientByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    if (
      !user ||
      user.role !== UserRole.CLIENT ||
      user.status === UserStatus.SUSPENDED
    ) {
      throw new ForbiddenException('Client portal access denied')
    }

    return user
  }

  async requireClient(accessToken: string): Promise<AuthenticatedClient> {
    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)
    const user = await this.loadClientByEmail(email)

    if (user.supabaseAuthId !== authUser.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: authUser.id },
      })
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      supabaseAuthId: authUser.id,
      organization: this.mapClientOrganization(user.organization),
    }
  }

  async syncClientSession(accessToken: string) {
    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)
    const user = await this.loadClientByEmail(email)

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        supabaseAuthId: authUser.id,
      },
      include: { organization: true },
    })

    return {
      user: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        role: updated.role,
      },
      organization: this.mapClientOrganization(updated.organization),
    }
  }

  async assertAdminEmailAllowed(email: string) {
    const normalized = this.normalizeEmail(email)
    const user = await this.prisma.user.findUnique({ where: { email: normalized } })

    if (!user || !isAgencyAdminRole(user.role)) {
      throw new ForbiddenException('This email is not registered as an admin')
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Admin account is suspended')
    }

    return user
  }
}
