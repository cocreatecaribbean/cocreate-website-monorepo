import { Body, Controller, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'

@Controller('auth/admin')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

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
