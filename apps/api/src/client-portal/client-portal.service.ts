import { Injectable } from '@nestjs/common'
import { UserRole, UserStatus } from '@cocreate/database'
import type { PortalProfileResponse } from '@cocreate/api-contracts/v1/client-portal'
import type { UpdateUserPreferencesInput } from '@cocreate/api-contracts/v1/requests/users'
import type { UserPreferencesResponse } from '@cocreate/api-contracts/v1/shared/preferences'
import { AuthService } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { UserPreferencesService } from '../users/user-preferences.service'

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly authService: AuthService,
    private readonly clientAccess: ClientAccessService,
    private readonly preferences: UserPreferencesService,
  ) {}

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

  async syncSession(accessToken: string) {
    const payload = await this.authService.syncClientSession(accessToken)
    return { ok: true as const, ...payload }
  }

  async getSessionProfile(
    client: Awaited<ReturnType<AuthService['requireClient']>>,
  ): Promise<PortalProfileResponse> {
    const preferences = await this.preferences.getOrCreate(client.id)
    return {
      ok: true as const,
      user: {
        id: client.id,
        email: client.email,
        status: client.status,
        role: client.role,
        clientOrgRole: client.clientOrgRole,
        canAccessSocialListening: client.canAccessSocialListening,
      },
      organization: client.organization,
      permissions: {
        canManageOrgTeam: this.clientAccess.canManageOrgTeam(client),
        canAccessTeamHub: this.clientAccess.canAccessTeamHub(client),
        canManageOrgRoles: this.clientAccess.canManageOrgRoles(client),
        canInviteOrgMemberImmediately:
          this.clientAccess.canInviteOrgMemberImmediately(client),
        canRequestOrgInvite: this.clientAccess.canRequestOrgInvite(client),
        canToggleSocialListeningForTeam:
          this.clientAccess.canToggleSocialListeningForTeam(client),
        canCreateProject: this.clientAccess.canCreateProject(client),
        canUseSocialListening: this.clientAccess.canUseSocialListening(client),
      },
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

  private async isClientAllowed(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    return (
      Boolean(user) &&
      user!.role === UserRole.CLIENT &&
      user!.status !== UserStatus.SUSPENDED
    )
  }
}
