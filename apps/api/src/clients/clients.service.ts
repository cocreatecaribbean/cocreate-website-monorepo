import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import {
  ClientOrgRole,
  UserRole,
  UserStatus,
} from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import { uniqueSlug } from '../common/utils/slug.util'
import type { InviteClientInput } from '@cocreate/api-contracts/v1/requests/clients'
import { SubscriptionService } from '../billing/subscription.service'
import { SupabaseAuthService } from './supabase-auth.service'
import type {
  ClientOrganizationRosterItem,
  ClientPrimaryContact,
  InviteClientResult,
} from './types/client-roster.types'

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private mapOrganizationRoster(
    org: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isSocialListeningSubscriber: boolean
    brand24ProjectId: string | null
    createdAt: Date
    updatedAt: Date
    users?: {
      id: string
      email: string
      role: UserRole
      status: UserStatus
      clientOrgRole: ClientOrgRole | null
      canAccessSocialListening: boolean
      createdAt: Date
      updatedAt: Date
    }[]
    memberships?: Array<{
      status: UserStatus
      clientOrgRole: ClientOrgRole
      canAccessSocialListening: boolean
      createdAt: Date
      updatedAt: Date
      user: {
        id: string
        email: string
        role: UserRole
        createdAt: Date
        updatedAt: Date
      }
    }>
  },
    latestSnapshot?: {
      createdAt: Date
      source: string
      snapshotDate: Date
    },
  ): ClientOrganizationRosterItem {
    const members =
      org.memberships?.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        role: m.user.role,
        status: m.status,
        clientOrgRole: m.clientOrgRole as ClientOrgRole | null,
        canAccessSocialListening: m.canAccessSocialListening,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })) ??
      org.users ??
      []
    const primaryUser = this.pickPrimaryContactUser(members)
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      isSocialListeningSubscriber: org.isSocialListeningSubscriber,
      brand24ProjectId: org.brand24ProjectId,
      socialListeningLastSnapshotAt: latestSnapshot?.createdAt ?? null,
      socialListeningLastSnapshotDate: latestSnapshot
        ? latestSnapshot.snapshotDate.toISOString().slice(0, 10)
        : null,
      socialListeningLastSnapshotSource: latestSnapshot?.source ?? null,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      primaryContact: primaryUser ? this.mapPrimaryContact(primaryUser) : null,
    }
  }

  private pickPrimaryContactUser<
    T extends {
      clientOrgRole: ClientOrgRole | null
      createdAt: Date
    },
  >(users: T[]): T | undefined {
    if (users.length === 0) return undefined
    const owner = users.find((u) => u.clientOrgRole === ClientOrgRole.ADMIN)
    return owner ?? users[0]
  }

  private mapPrimaryContact(user: {
    id: string
    email: string
    role: UserRole
    status: UserStatus
    clientOrgRole: ClientOrgRole | null
    canAccessSocialListening: boolean
    createdAt: Date
    updatedAt: Date
  }): ClientPrimaryContact {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      clientOrgRole: user.clientOrgRole,
      canAccessSocialListening: user.canAccessSocialListening,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async inviteClient(dto: InviteClientInput): Promise<InviteClientResult> {
    const email = this.normalizeEmail(dto.clientEmail)
    const companyName = dto.companyName.trim()

    const existingUser = await this.prisma.user.findUnique({ where: { email } })
    if (existingUser && existingUser.role !== UserRole.CLIENT) {
      throw new ConflictException(
        'This email is an agency account and can’t join a client org',
      )
    }

    const slug = await uniqueSlug(companyName, async (candidate) => {
      const org = await this.prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
      return org === null
    })

    const enableSocialListening = dto.enableSocialListening ?? false
    const logoUrl = dto.logoUrl?.trim() || null

    const { organization, user, needsAuthInvite } = await this.prisma.$transaction(
      async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: companyName,
            slug,
            logoUrl,
            isSocialListeningSubscriber: false,
          },
        })

        if (existingUser) {
          if (existingUser.deletedAt) {
            await tx.user.update({
              where: { id: existingUser.id },
              data: { deletedAt: null },
            })
          }

          const membershipStatus = existingUser.supabaseAuthId
            ? UserStatus.ACTIVE
            : UserStatus.INVITED

          await tx.clientOrganizationMembership.create({
            data: {
              userId: existingUser.id,
              organizationId: organization.id,
              clientOrgRole: ClientOrgRole.ADMIN,
              status: membershipStatus,
              canAccessSocialListening: false,
            },
          })

          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              organizationId: existingUser.organizationId ?? organization.id,
              lastActiveOrganizationId: organization.id,
              clientOrgRole: ClientOrgRole.ADMIN,
              status:
                membershipStatus === UserStatus.ACTIVE
                  ? UserStatus.ACTIVE
                  : existingUser.status,
            },
          })

          return {
            organization,
            user: existingUser,
            needsAuthInvite: !existingUser.supabaseAuthId,
          }
        }

        const user = await tx.user.create({
          data: {
            email,
            organizationId: organization.id,
            lastActiveOrganizationId: organization.id,
            role: UserRole.CLIENT,
            status: UserStatus.INVITED,
            clientOrgRole: ClientOrgRole.ADMIN,
            canAccessSocialListening: false,
            organizationMemberships: {
              create: {
                organizationId: organization.id,
                clientOrgRole: ClientOrgRole.ADMIN,
                status: UserStatus.INVITED,
                canAccessSocialListening: false,
              },
            },
          },
        })

        return { organization, user, needsAuthInvite: true }
      },
    )

    if (enableSocialListening) {
      await this.subscriptions.setAdminCompEntitlement(organization.id, true)
    }

    const portalBase = process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
    const redirectTo = `${portalBase}/auth/callback?organizationId=${encodeURIComponent(organization.id)}`

    let invitation: Awaited<ReturnType<SupabaseAuthService['inviteUserByEmail']>> | {
      status: string
      invitationId?: string
      devSignInUrl?: string
    }

    if (needsAuthInvite) {
      try {
        invitation = await this.supabaseAuth.inviteUserByEmail({
          email,
          organizationId: organization.id,
          organizationSlug: organization.slug,
          redirectTo,
        })
      } catch (err) {
        await this.prisma.$transaction(async (tx) => {
          await tx.clientOrganizationMembership.deleteMany({
            where: { userId: user.id, organizationId: organization.id },
          })
          if (!existingUser) {
            await tx.user.delete({ where: { id: user.id } })
          }
          await tx.organization.delete({ where: { id: organization.id } })
        })
        throw err
      }

      if (invitation.status === 'sent' && invitation.invitationId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { supabaseAuthId: invitation.invitationId },
        })
      }
    } else {
      invitation = {
        status: 'stubbed' as const,
        invitationId: existingUser?.supabaseAuthId ?? undefined,
      }
    }

    const contact = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    })

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
        isSocialListeningSubscriber: organization.isSocialListeningSubscriber,
        brand24ProjectId: organization.brand24ProjectId,
      },
      user: this.mapPrimaryContact(contact),
      invitation: {
        provider: 'supabase-auth' as const,
        status: invitation.status as 'sent' | 'stubbed' | 'dev_link',
        invitationId: invitation.invitationId ?? '',
        ...(invitation.devSignInUrl
          ? { devSignInUrl: invitation.devSignInUrl }
          : {}),
      },
    }
  }

  async listClientRoster(): Promise<ClientOrganizationRosterItem[]> {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const latestSnapshots = await this.prisma.socialListeningSnapshot.findMany({
      distinct: ['organizationId'],
      orderBy: [{ organizationId: 'asc' }, { snapshotDate: 'desc' }],
      select: {
        organizationId: true,
        createdAt: true,
        source: true,
        snapshotDate: true,
      },
    })
    const snapshotByOrg = new Map(
      latestSnapshots.map((row) => [row.organizationId, row]),
    )

    return organizations.map((org) =>
      this.mapOrganizationRoster(org, snapshotByOrg.get(org.id)),
    )
  }

  async getClientRosterItem(
    organizationId: string,
  ): Promise<ClientOrganizationRosterItem> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!organization) {
      throw new NotFoundException('Organization not found')
    }
    return this.mapOrganizationRoster(organization)
  }

  async updateSocialListeningSubscription(
    organizationId: string,
    enabled: boolean,
  ): Promise<ClientOrganizationRosterItem> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    await this.subscriptions.setAdminCompEntitlement(organizationId, enabled)

    const updated = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.mapOrganizationRoster(updated)
  }

  async updateBrand24Project(
    organizationId: string,
    brand24ProjectId: string | null | undefined,
  ): Promise<ClientOrganizationRosterItem> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    const normalized =
      brand24ProjectId === undefined
        ? undefined
        : brand24ProjectId === null || brand24ProjectId.trim() === ''
          ? null
          : brand24ProjectId.trim()

    if (normalized && !/^[a-zA-Z0-9_-]{3,64}$/.test(normalized)) {
      throw new BadRequestException(
        'Brand24 project ID must be 3–64 characters (letters, numbers, hyphens, underscores)',
      )
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data:
        normalized === undefined ? {} : { brand24ProjectId: normalized },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.mapOrganizationRoster(updated)
  }

  async suspendClientUser(userId: string): Promise<ClientPrimaryContact> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    })

    return this.mapPrimaryContact(updated)
  }

  async updateOrganizationLogo(
    organizationId: string,
    logoUrl: string,
  ): Promise<ClientOrganizationRosterItem> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    })
    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logoUrl: logoUrl.trim() },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.mapOrganizationRoster(updated)
  }

  async clearOrganizationLogo(
    organizationId: string,
  ): Promise<ClientOrganizationRosterItem> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    })
    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logoUrl: null },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.mapOrganizationRoster(updated)
  }

  /** Legacy allowlist assign — creates org + INVITED user from email alone. */
  async assignPortalUser(email: string) {
    const normalized = this.normalizeEmail(email)
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: { organization: true },
    })

    if (existing) {
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: { status: UserStatus.INVITED },
      })
      return this.legacyPortalUserShape(updated)
    }

    const localPart = normalized.split('@')[0] ?? 'client'
    const slug = await uniqueSlug(localPart, async (candidate) => {
      const org = await this.prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
      return org === null
    })

    const { user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: localPart,
          slug,
          isSocialListeningSubscriber: false,
        },
      })

      const user = await tx.user.create({
        data: {
          email: normalized,
          organizationId: organization.id,
          role: UserRole.CLIENT,
          status: UserStatus.INVITED,
        },
      })

      return { user }
    })

    await this.supabaseAuth.inviteUserByEmail({
      email: normalized,
      organizationId: user.organizationId!,
      organizationSlug: slug,
    })

    return this.legacyPortalUserShape(user)
  }

  async listPortalUsersLegacy() {
    const users = await this.prisma.user.findMany({
      where: { role: UserRole.CLIENT },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      isActive: user.status !== UserStatus.SUSPENDED,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  }

  async deactivatePortalUserLegacy(id: string) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    })
    return this.legacyPortalUserShape(updated)
  }

  private legacyPortalUserShape(user: {
    id: string
    email: string
    status: UserStatus
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: user.id,
      email: user.email,
      isActive: user.status !== UserStatus.SUSPENDED,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
