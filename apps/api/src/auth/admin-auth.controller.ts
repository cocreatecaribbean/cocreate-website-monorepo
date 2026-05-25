import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AdminAuthGuard, type AdminRequest } from './guards/admin-auth.guard'
import { SupabaseAuthService } from '../clients/supabase-auth.service'

@Controller('auth/admin')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

  /** Current admin from Bearer token (or dev x-admin-key). */
  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AdminRequest) {
    if (request.adminUser) {
      return {
        ok: true as const,
        mode: 'user' as const,
        admin: {
          id: request.adminUser.id,
          email: request.adminUser.email,
          status: request.adminUser.status,
          role: request.adminUser.role,
        },
      }
    }

    return { ok: true as const, mode: 'api_key' as const }
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
