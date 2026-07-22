import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  UpdateUserPreferencesSchema,
  type UpdateUserPreferencesInput,
} from '@cocreate/api-contracts/v1/requests/users'
import { AuthService } from './auth.service'
import { isAgencyAdminRole } from './admin-roles'
import { AdminAuthGuard, type AdminRequest } from './guards/admin-auth.guard'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { AdminProfileService } from '../users/admin-profile.service'
import { UserPreferencesService } from '../users/user-preferences.service'
import { MessageEmailDigestService } from '../messaging/message-email-digest.service'
import { zodBody } from '../common/zod/zod-validation.pipe'

@Controller({ path: 'auth/admin', version: '1' })
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly config: ConfigService,
    private readonly adminProfiles: AdminProfileService,
    private readonly preferences: UserPreferencesService,
    private readonly messageDigests: MessageEmailDigestService,
  ) {}

  /** Current admin from Bearer token (or dev x-admin-key). */
  @Get('me')
  @UseGuards(AdminAuthGuard)
  async me(@Req() request: AdminRequest) {
    if (request.adminUser) {
      const isAdmin = isAgencyAdminRole(request.adminUser.role)
      const [profile, preferences] = await Promise.all([
        isAdmin ? this.adminProfiles.getProfile(request.adminUser) : Promise.resolve(null),
        this.preferences.getOrCreate(request.adminUser.id),
      ])
      return {
        ok: true as const,
        mode: 'user' as const,
        admin: {
          id: request.adminUser.id,
          email: request.adminUser.email,
          status: request.adminUser.status,
          role: request.adminUser.role,
          profile,
          preferences,
        },
      }
    }

    return { ok: true as const, mode: 'api_key' as const }
  }

  @Post('presence')
  @UseGuards(AdminAuthGuard)
  async presence(@Req() request: AdminRequest) {
    if (!request.adminUser) return { ok: true as const }
    await this.messageDigests.touchLastSeen(request.adminUser.id)
    return { ok: true as const }
  }

  @Patch('preferences')
  @UseGuards(AdminAuthGuard)
  async updatePreferences(
    @Req() request: AdminRequest,
    @Body(zodBody(UpdateUserPreferencesSchema)) body: UpdateUserPreferencesInput,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Preferences require a signed-in user.' }
    }
    const preferences = await this.preferences.update(request.adminUser.id, body)
    return { ok: true as const, ...preferences }
  }

  @Post('magic-link')
  async requestMagicLink(@Body() body: { email?: string }) {
    const email = body?.email?.trim() ?? ''
    if (!email) {
      return { ok: false as const, message: 'Email is required' }
    }

    await this.authService.assertAdminEmailAllowed(email)

    const adminCenterUrl =
      this.config.get<string>('ADMIN_CENTER_URL') ?? 'http://localhost:3002'

    const result = await this.supabaseAuth.sendAllowlistedMagicLink(
      email,
      `${adminCenterUrl}/auth/callback`,
      { role: 'ADMIN' },
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
}
