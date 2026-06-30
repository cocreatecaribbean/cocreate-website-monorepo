import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientOrgRole, UserRole, UserStatus } from '@cocreate/database'
import { isAgencyAdminRole, isAgencyStaffRole, isCollaboratorRole } from './admin-roles'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { PrismaService } from '../prisma/prisma.service'
import { AuthTokenCache } from './auth-token-cache'

export type AuthenticatedAdmin = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  supabaseAuthId: string | null
}

/** Core admin or project-scoped collaborator (Admin Center). */
export type AuthenticatedAgencyUser = AuthenticatedAdmin

export type AuthenticatedClient = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  supabaseAuthId: string | null
  clientOrgRole: ClientOrgRole | null
  canAccessSocialListening: boolean
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
  private readonly supabaseUserCache = new AuthTokenCache<User>()
  private readonly agencyUserCache = new AuthTokenCache<AuthenticatedAgencyUser>()
  private readonly clientUserCache = new AuthTokenCache<AuthenticatedClient>()

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
    const cached = this.supabaseUserCache.get(accessToken)
    if (cached) return cached

    if (!this.adminClient) {
      throw new UnauthorizedException('Supabase Auth is not configured')
    }

    const { data, error } = await this.adminClient.auth.getUser(accessToken)
    if (error || !data.user?.email) {
      throw new UnauthorizedException('Invalid or expired session')
    }

    this.supabaseUserCache.set(accessToken, data.user)
    return data.user
  }

  async requireAgencyUser(accessToken: string): Promise<AuthenticatedAgencyUser> {
    const cached = this.agencyUserCache.get(accessToken)
    if (cached) return cached

    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)

    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || !isAgencyStaffRole(user.role)) {
      throw new ForbiddenException('Agency access required')
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended')
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

    const result = {
      id: refreshed.id,
      email: refreshed.email,
      role: refreshed.role,
      status: refreshed.status,
      supabaseAuthId: refreshed.supabaseAuthId,
    }
    this.agencyUserCache.set(accessToken, result)
    return result
  }

  async requireAdmin(accessToken: string): Promise<AuthenticatedAdmin> {
    const agencyUser = await this.requireAgencyUser(accessToken)
    if (!isAgencyAdminRole(agencyUser.role)) {
      throw new ForbiddenException('Admin access required')
    }
    return agencyUser
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
    const cached = this.clientUserCache.get(accessToken)
    if (cached) return cached

    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)
    const user = await this.loadClientByEmail(email)

    if (user.supabaseAuthId !== authUser.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: authUser.id },
      })
    }

    const result = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      supabaseAuthId: authUser.id,
      clientOrgRole: user.clientOrgRole,
      canAccessSocialListening: user.canAccessSocialListening,
      organization: this.mapClientOrganization(user.organization),
    }
    this.clientUserCache.set(accessToken, result)
    return result
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
        clientOrgRole: updated.clientOrgRole,
        canAccessSocialListening: updated.canAccessSocialListening,
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

  async assertCollaboratorEmailAllowed(email: string) {
    const normalized = this.normalizeEmail(email)
    const user = await this.prisma.user.findUnique({ where: { email: normalized } })

    if (!user || !isCollaboratorRole(user.role)) {
      throw new ForbiddenException('This email is not registered as a project collaborator')
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Collaborator account is suspended')
    }

    const membership = await this.prisma.agencyProjectMember.findFirst({
      where: { userId: user.id },
    })
    if (!membership) {
      throw new ForbiddenException('No project access assigned to this account')
    }

    return user
  }
}
