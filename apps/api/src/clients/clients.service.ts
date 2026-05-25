import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UserRole, UserStatus } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import { uniqueSlug } from '../common/utils/slug.util'
import { InviteClientDto } from './dto/invite-client.dto'
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
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private mapOrganizationRoster(org: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isSocialListeningSubscriber: boolean
    brand24ProjectId: string | null
    createdAt: Date
    updatedAt: Date
    users: {
      id: string
      email: string
      role: UserRole
      status: UserStatus
      createdAt: Date
      updatedAt: Date
    }[]
  }): ClientOrganizationRosterItem {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      isSocialListeningSubscriber: org.isSocialListeningSubscriber,
      brand24ProjectId: org.brand24ProjectId,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      primaryContact: org.users[0] ? this.mapPrimaryContact(org.users[0]) : null,
    }
  }

  private mapPrimaryContact(user: {
    id: string
    email: string
    role: UserRole
    status: UserStatus
    createdAt: Date
    updatedAt: Date
  }): ClientPrimaryContact {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async inviteClient(dto: InviteClientDto): Promise<InviteClientResult> {
    const email = this.normalizeEmail(dto.clientEmail)
    const companyName = dto.companyName.trim()

    const existingUser = await this.prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ConflictException(`A user with email ${email} already exists`)
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

    const { organization, user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: companyName,
          slug,
          logoUrl,
          isSocialListeningSubscriber: enableSocialListening,
        },
      })

      const user = await tx.user.create({
        data: {
          email,
          organizationId: organization.id,
          role: UserRole.CLIENT,
          status: UserStatus.INVITED,
        },
      })

      return { organization, user }
    })

    const portalBase = process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'

    let invitation: Awaited<ReturnType<SupabaseAuthService['inviteUserByEmail']>>
    try {
      invitation = await this.supabaseAuth.inviteUserByEmail({
        email,
        organizationId: organization.id,
        organizationSlug: organization.slug,
        redirectTo: `${portalBase}/auth/callback`,
      })
    } catch (err) {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.delete({ where: { id: user.id } })
        await tx.organization.delete({ where: { id: organization.id } })
      })
      throw err
    }

    if (invitation.status === 'sent') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: invitation.invitationId },
      })
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
        provider: 'supabase-auth',
        status: invitation.status,
        invitationId: invitation.invitationId,
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
        users: {
          where: { role: UserRole.CLIENT },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return organizations.map((org) => this.mapOrganizationRoster(org))
  }

  async updateSocialListeningSubscription(
    organizationId: string,
    enabled: boolean,
  ): Promise<ClientOrganizationRosterItem> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          where: { role: UserRole.CLIENT },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { isSocialListeningSubscriber: enabled },
      include: {
        users: {
          where: { role: UserRole.CLIENT },
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
        users: {
          where: { role: UserRole.CLIENT },
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

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data:
        normalized === undefined ? {} : { brand24ProjectId: normalized },
      include: {
        users: {
          where: { role: UserRole.CLIENT },
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
