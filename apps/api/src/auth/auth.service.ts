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

export type ClientOrganizationSummary = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isSocialListeningSubscriber: boolean
}

export type ClientMembershipSummary = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  clientOrgRole: ClientOrgRole
  status: UserStatus
  canAccessSocialListening: boolean
}

export type AuthenticatedClient = {
  id: string
  email: string
  role: UserRole
  /** Status of the *active* org membership (not global User.status). */
  status: UserStatus
  supabaseAuthId: string | null
  clientOrgRole: ClientOrgRole | null
  canAccessSocialListening: boolean
  canAccessGetHelp: boolean
  organization: ClientOrganizationSummary | null
  /** Non-suspended memberships available for org switcher. */
  memberships: ClientMembershipSummary[]
}

export type RequireClientOptions = {
  /** Preferred org from X-Organization-Id / invite deep-link. */
  organizationId?: string | null
}

@Injectable()
export class AuthService {
  private readonly adminClient: SupabaseClient
  private readonly publicClient: SupabaseClient | null
  private readonly supabaseUserCache = new AuthTokenCache<User>()
  private readonly agencyUserCache = new AuthTokenCache<AuthenticatedAgencyUser>()
  /** Cache key includes active org so switcher works. */
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

  private clientCacheKey(accessToken: string, organizationId?: string | null) {
    return `${accessToken}::${organizationId ?? ''}`
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
  ): ClientOrganizationSummary | null {
    if (!organization) return null
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
      isSocialListeningSubscriber: organization.isSocialListeningSubscriber,
    }
  }

  private async loadClientUserRow(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: {
          where: { status: { not: UserStatus.SUSPENDED } },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isSocialListeningSubscriber: true,
                deletedAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!user || user.role !== UserRole.CLIENT || user.deletedAt) {
      throw new ForbiddenException('Client portal access denied')
    }

    const memberships = user.organizationMemberships.filter(
      (m) => !m.organization.deletedAt,
    )
    if (memberships.length === 0) {
      throw new ForbiddenException('Client portal access denied')
    }

    return { user, memberships }
  }

  private pickActiveMembership<
    T extends { organizationId: string; organization: { id: string } },
  >(
    memberships: T[],
    preferredOrganizationId: string | null | undefined,
    lastActiveOrganizationId: string | null,
  ): T {
    if (
      preferredOrganizationId &&
      memberships.some((m) => m.organizationId === preferredOrganizationId)
    ) {
      return memberships.find((m) => m.organizationId === preferredOrganizationId)!
    }
    if (
      lastActiveOrganizationId &&
      memberships.some((m) => m.organizationId === lastActiveOrganizationId)
    ) {
      return memberships.find((m) => m.organizationId === lastActiveOrganizationId)!
    }
    return memberships[0]!
  }

  private toAuthenticatedClient(
    user: {
      id: string
      email: string
      role: UserRole
      supabaseAuthId: string | null
    },
    active: {
      status: UserStatus
      clientOrgRole: ClientOrgRole
      canAccessSocialListening: boolean
      canAccessGetHelp: boolean
      organization: {
        id: string
        name: string
        slug: string
        logoUrl: string | null
        isSocialListeningSubscriber: boolean
      }
    },
    memberships: Array<{
      organizationId: string
      clientOrgRole: ClientOrgRole
      status: UserStatus
      canAccessSocialListening: boolean
      canAccessGetHelp: boolean
      organization: { id: string; name: string; slug: string }
    }>,
    supabaseAuthId: string,
  ): AuthenticatedClient {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: active.status,
      supabaseAuthId,
      clientOrgRole: active.clientOrgRole,
      canAccessSocialListening: active.canAccessSocialListening,
      canAccessGetHelp: active.canAccessGetHelp,
      organization: this.mapClientOrganization(active.organization),
      memberships: memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        clientOrgRole: m.clientOrgRole,
        status: m.status,
        canAccessSocialListening: m.canAccessSocialListening,
        canAccessGetHelp: m.canAccessGetHelp,
      })),
    }
  }

  async requireClient(
    accessToken: string,
    options: RequireClientOptions = {},
  ): Promise<AuthenticatedClient> {
    const preferredOrgId = options.organizationId?.trim() || null
    const cacheKey = this.clientCacheKey(accessToken, preferredOrgId)
    const cached = this.clientUserCache.get(cacheKey)
    if (cached) return cached

    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)
    const { user, memberships } = await this.loadClientUserRow(email)

    if (user.supabaseAuthId !== authUser.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: authUser.id },
      })
    }

    const active = this.pickActiveMembership(
      memberships,
      preferredOrgId,
      user.lastActiveOrganizationId,
    )

    if (user.lastActiveOrganizationId !== active.organizationId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastActiveOrganizationId: active.organizationId },
      })
    }

    // Promote INVITED → ACTIVE on first successful session for this membership
    if (active.status === UserStatus.INVITED) {
      await this.prisma.clientOrganizationMembership.update({
        where: { id: active.id },
        data: { status: UserStatus.ACTIVE },
      })
      active.status = UserStatus.ACTIVE
    }

    const result = this.toAuthenticatedClient(
      user,
      active,
      memberships,
      authUser.id,
    )
    this.clientUserCache.set(cacheKey, result)
    return result
  }

  /**
   * Prefer this over reading `requireClient` results directly when capability
   * toggles must be current (team SL / Get Help flags).
   */
  async requireClientWithFreshCapabilities(
    accessToken: string,
    options: RequireClientOptions = {},
  ): Promise<AuthenticatedClient> {
    const client = await this.requireClient(accessToken, options)
    return this.refreshClientMembershipCapabilities(client)
  }

  async setActiveOrganization(
    accessToken: string,
    organizationId: string,
  ): Promise<AuthenticatedClient> {
    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)
    const { user, memberships } = await this.loadClientUserRow(email)

    const target = memberships.find((m) => m.organizationId === organizationId)
    if (!target) {
      throw new ForbiddenException('You do not belong to that organization')
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveOrganizationId: organizationId },
    })

    return this.requireClient(accessToken, { organizationId })
  }

  async syncClientSession(
    accessToken: string,
    options: RequireClientOptions = {},
  ) {
    const authUser = await this.getSupabaseUserFromToken(accessToken)
    const email = this.normalizeEmail(authUser.email!)
    const { user, memberships } = await this.loadClientUserRow(email)

    const preferredOrgId =
      options.organizationId?.trim() ||
      (typeof authUser.user_metadata?.organizationId === 'string'
        ? authUser.user_metadata.organizationId
        : null)

    const active = this.pickActiveMembership(
      memberships,
      preferredOrgId,
      user.lastActiveOrganizationId,
    )

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        supabaseAuthId: authUser.id,
        lastActiveOrganizationId: active.organizationId,
      },
    })

    if (active.status === UserStatus.INVITED) {
      await this.prisma.clientOrganizationMembership.update({
        where: { id: active.id },
        data: { status: UserStatus.ACTIVE },
      })
      active.status = UserStatus.ACTIVE
    }

    const client = this.toAuthenticatedClient(
      user,
      active,
      memberships,
      authUser.id,
    )

    return {
      user: {
        id: client.id,
        email: client.email,
        status: client.status,
        role: client.role,
        clientOrgRole: client.clientOrgRole,
        canAccessSocialListening: client.canAccessSocialListening,
      },
      organization: client.organization,
      memberships: client.memberships,
    }
  }

  /**
   * Re-read capability flags from the active org membership so Team toggles
   * take effect on `/me` without waiting for the auth token cache TTL.
   */
  async refreshClientMembershipCapabilities(
    client: AuthenticatedClient,
  ): Promise<AuthenticatedClient> {
    const organizationId = client.organization?.id
    if (!organizationId) return client

    const membership = await this.prisma.clientOrganizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: client.id, organizationId },
      },
      select: {
        status: true,
        clientOrgRole: true,
        canAccessSocialListening: true,
        canAccessGetHelp: true,
      },
    })
    if (!membership) return client

    return {
      ...client,
      status: membership.status,
      clientOrgRole: membership.clientOrgRole,
      canAccessSocialListening: membership.canAccessSocialListening,
      canAccessGetHelp: membership.canAccessGetHelp,
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
