import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { UserRole, UserStatus } from '@cocreate/database'
import type { PortalProfileResponse } from '@cocreate/api-contracts/v1/client-portal'
import type { UpdateOrganizationLogoInput } from '@cocreate/api-contracts/v1/requests/clients'
import type {
  UpdateClientProfileInput,
  UpdateUserPreferencesInput,
} from '@cocreate/api-contracts/v1/requests/users'
import type { UserPreferencesResponse } from '@cocreate/api-contracts/v1/shared/preferences'
import { AuthService } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { ClientsService } from '../clients/clients.service'
import { ClientLogoStorageService } from '../clients/client-logo-storage.service'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { ClientProfileService } from '../users/client-profile.service'
import { UserPreferencesService } from '../users/user-preferences.service'
import { MessageEmailDigestService } from '../messaging/message-email-digest.service'

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly authService: AuthService,
    private readonly clientAccess: ClientAccessService,
    private readonly preferences: UserPreferencesService,
    private readonly clientsService: ClientsService,
    private readonly clientProfiles: ClientProfileService,
    private readonly messageDigests: MessageEmailDigestService,
  ) {}

  async touchPresence(userId: string) {
    await this.messageDigests.touchLastSeen(userId)
    return { ok: true as const }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private portalCallbackUrl() {
    const portalBase =
      process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3003'
    return `${portalBase}/auth/callback`
  }

  async validateLogin(email: string) {
    const normalized = this.normalizeEmail(email)
    const allowed = await this.isClientAllowed(normalized)
    if (!allowed) {
      return {
        ok: false as const,
        message:
          'This email does not have client portal access. Contact CoCreate if you need help.',
      }
    }

    return this.requestMagicLink(email)
  }

  async requestMagicLink(email: string) {
    const normalized = this.normalizeEmail(email)
    const allowed = await this.isClientAllowed(normalized)
    if (!allowed) {
      return {
        ok: false as const,
        message:
          'This email does not have client portal access. Contact CoCreate if you need help.',
      }
    }

    const result = await this.supabaseAuth.sendAllowlistedMagicLink(
      normalized,
      this.portalCallbackUrl(),
      { role: 'CLIENT' },
    )

    if (result.status === 'dev_link' && result.devSignInUrl) {
      return {
        ok: true as const,
        message:
          'Development mode: open the sign-in link below (no email sent).',
        devSignInUrl: result.devSignInUrl,
      }
    }

    return {
      ok: true as const,
      message: 'Check your email for a sign-in link.',
    }
  }

  async syncSession(accessToken: string, organizationId?: string | null) {
    const payload = await this.authService.syncClientSession(accessToken, {
      organizationId,
    })
    return { ok: true as const, ...payload }
  }

  async setActiveOrganization(
    accessToken: string,
    organizationId: string,
  ) {
    const client = await this.authService.setActiveOrganization(
      accessToken,
      organizationId,
    )
    return this.getSessionProfile(client)
  }

  async getSessionProfile(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
  ): Promise<PortalProfileResponse> {
    const freshClient =
      await this.authService.refreshClientMembershipCapabilities(client)
    const [preferences, profileFields] = await Promise.all([
      this.preferences.getOrCreate(freshClient.id),
      this.clientProfiles.getProfileFields(freshClient.id),
    ])
    return {
      ok: true as const,
      user: {
        id: freshClient.id,
        email: freshClient.email,
        status: freshClient.status,
        role: freshClient.role,
        clientOrgRole: freshClient.clientOrgRole,
        canAccessSocialListening: freshClient.canAccessSocialListening,
        canAccessGetHelp: freshClient.canAccessGetHelp,
        displayName: profileFields.displayName,
        avatarUrl: profileFields.avatarUrl,
      },
      organization: freshClient.organization,
      memberships: freshClient.memberships,
      permissions: this.clientAccess.buildPortalPermissions(freshClient),
      preferences,
    }
  }

  async updatePreferences(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
    dto: UpdateUserPreferencesInput,
  ): Promise<UserPreferencesResponse> {
    const preferences = await this.preferences.update(client.id, dto)
    return { ok: true as const, ...preferences }
  }

  private assertCanManageOrgTeam(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
  ) {
    if (!this.clientAccess.canManageOrgTeam(client)) {
      throw new ForbiddenException('Only organization owners can manage branding')
    }
    if (!client.organization?.id) {
      throw new NotFoundException('Organization not found')
    }
    return client.organization.id
  }

  async createOrganizationLogoUploadUrl(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
    logoStorage: ClientLogoStorageService,
    body: { fileName: string; mimeType: string; sizeBytes: number },
  ) {
    this.assertCanManageOrgTeam(client)
    return logoStorage.createUploadUrl(body)
  }

  async updateOrganizationLogo(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
    logoStorage: ClientLogoStorageService,
    body: UpdateOrganizationLogoInput,
  ) {
    const organizationId = this.assertCanManageOrgTeam(client)
    const logoUrl = body.storagePath?.trim()
      ? logoStorage.publicUrlForPath(body.storagePath.trim())
      : body.logoUrl!.trim()
    const updated = await this.clientsService.updateOrganizationLogo(
      organizationId,
      logoUrl,
    )
    return {
      ok: true as const,
      organization: client.organization
        ? { ...client.organization, logoUrl: updated.logoUrl }
        : { id: organizationId, name: updated.name, logoUrl: updated.logoUrl },
    }
  }

  async clearOrganizationLogo(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
  ) {
    const organizationId = this.assertCanManageOrgTeam(client)
    const updated = await this.clientsService.clearOrganizationLogo(organizationId)
    return {
      ok: true as const,
      organization: client.organization
        ? { ...client.organization, logoUrl: null }
        : { id: organizationId, name: updated.name, logoUrl: null },
    }
  }

  async updateClientProfile(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
    dto: UpdateClientProfileInput,
  ) {
    const profile = await this.clientProfiles.updateProfile(client.id, dto)
    return { ok: true as const, profile }
  }

  async createClientAvatarUploadUrl(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
    dto: { fileName: string; mimeType: string; sizeBytes: number },
  ) {
    const upload = await this.clientProfiles.createAvatarUploadUrl(client.id, dto)
    return { ok: true as const, ...upload }
  }

  async registerClientAvatar(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
    dto: { storagePath: string },
  ) {
    const profile = await this.clientProfiles.registerAvatar(client.id, dto)
    return { ok: true as const, profile }
  }

  async deleteClientAvatar(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
  ) {
    const profile = await this.clientProfiles.deleteAvatar(client.id)
    return { ok: true as const, profile }
  }

  private async isClientAllowed(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    return (
      Boolean(user) &&
      user!.role === UserRole.CLIENT &&
      user!.status !== UserStatus.SUSPENDED
    )
  }
}
