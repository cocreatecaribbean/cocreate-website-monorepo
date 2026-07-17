import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  formatSupabaseAuthError,
  toBadRequestMessage,
} from './supabase-auth.errors'
import {
  ResendAuthMailService,
  type AuthEmailKind,
} from './resend-auth-mail.service'

export type SupabaseInvitePayload = {
  email: string
  organizationId: string
  organizationSlug: string
  redirectTo?: string
  projectTitle?: string
  organizationName?: string
  inviteContext?: 'new_project' | 'invite_reminder'
}

export type SupabaseInviteResult = {
  invitationId: string
  status: 'sent' | 'stubbed' | 'dev_link'
  devSignInUrl?: string
}

export type MagicLinkResult = {
  status: 'sent' | 'stubbed' | 'dev_link'
  devSignInUrl?: string
}

@Injectable()
export class SupabaseAuthService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseAuthService.name)
  private readonly adminClient: SupabaseClient | null
  private readonly publicClient: SupabaseClient | null

  constructor(
    private readonly config: ConfigService,
    private readonly resendMail: ResendAuthMailService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL')
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY')

    this.adminClient =
      url && serviceKey
        ? createClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null

    this.publicClient =
      url && anonKey
        ? createClient(url, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null
  }

  onModuleInit() {
    if (this.useDevSignInLinks()) {
      this.logger.log('Auth: dev sign-in links only (AUTH_DEV_LINKS=true)')
    } else if (this.useResendApi()) {
      this.logger.log(
        `Auth: Resend API (from ${this.resendMail.getFromAddress()})`,
      )
    } else {
      this.logger.warn(
        'Auth: Supabase SMTP for emails — set RESEND_API_KEY + AUTH_EMAIL_FROM in Doppler to use no-reply@mail.cocreatecaribbean.com via Resend',
      )
    }
  }

  private useDevSignInLinks(): boolean {
    if (process.env.NODE_ENV === 'production') return false
    const flag = this.config.get<string>('AUTH_DEV_LINKS')
    if (flag === 'false' || flag === '0') return false
    return true
  }

  /** When true, auth emails go through Resend API (from AUTH_EMAIL_FROM), not Supabase SMTP. */
  private useResendApi(): boolean {
    if (this.useDevSignInLinks()) return false
    const force =
      this.config.get<string>('AUTH_USE_RESEND_API') ??
      process.env.AUTH_USE_RESEND_API
    if (force === 'false' || force === '0') return false
    return this.resendMail.isConfigured()
  }

  private buildSignInUrl(
    redirectTo: string,
    properties:
      | {
          action_link?: string | null
          hashed_token?: string | null
          verification_type?: string | null
        }
      | null
      | undefined,
    fallbackKind: AuthEmailKind,
  ): string {
    const hashed = properties?.hashed_token
    const type = properties?.verification_type ?? fallbackKind
    if (hashed && redirectTo) {
      const url = new URL(redirectTo)
      url.searchParams.set('token_hash', hashed)
      url.searchParams.set('type', type)
      return url.toString()
    }
    return properties?.action_link ?? redirectTo
  }

  private throwAuthError(
    error: { message: string; code?: string; status?: number } | null | undefined,
    context: string,
  ): never {
    const details = formatSupabaseAuthError(error, context)
    this.logger.error(details.message)
    throw new BadRequestException(toBadRequestMessage(details))
  }

  private async generateAuthLink(
    email: string,
    redirectTo: string,
    userMetadata: Record<string, unknown> | undefined,
    kinds: AuthEmailKind[],
  ): Promise<{ signInUrl: string; userId: string; kind: AuthEmailKind }> {
    if (!this.adminClient) {
      throw new BadRequestException('Supabase admin client is not configured')
    }

    const failures: string[] = []

    for (const kind of kinds) {
      const { data, error } = await this.adminClient.auth.admin.generateLink({
        type: kind,
        email,
        options: { redirectTo, data: userMetadata },
      })

      const signInUrl = this.buildSignInUrl(redirectTo, data?.properties, kind)
      if (!error && signInUrl && data.user?.id) {
        return { signInUrl, userId: data.user.id, kind }
      }
      if (error) {
        failures.push(formatSupabaseAuthError(error, kind).message)
      }
    }

    throw new BadRequestException(
      failures.length > 0
        ? `Could not generate sign-in link: ${failures.join(' | ')}`
        : 'Could not generate sign-in link',
    )
  }

  private async sendAuthEmail(
    email: string,
    redirectTo: string,
    userMetadata: Record<string, unknown> | undefined,
    kinds: AuthEmailKind[],
    inviteCopy?: {
      projectTitle?: string
      organizationName?: string
      inviteContext?: 'new_project' | 'invite_reminder'
    },
  ): Promise<{ userId: string }> {
    const { signInUrl, userId, kind } = await this.generateAuthLink(
      email,
      redirectTo,
      userMetadata,
      kinds,
    )

    if (this.useResendApi()) {
      await this.resendMail.sendSignInEmail({
        to: email,
        actionLink: signInUrl,
        kind,
        projectTitle: inviteCopy?.projectTitle,
        organizationName: inviteCopy?.organizationName,
        inviteContext: inviteCopy?.inviteContext,
      })
      return { userId }
    }

    this.logger.log(
      `[invite] Resend API not configured — use Supabase SMTP or set RESEND_API_KEY + AUTH_EMAIL_FROM`,
    )
    throw new BadRequestException(
      'Email sending is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM in Doppler, or fix Supabase SMTP.',
    )
  }

  async generateDevSignInLink(
    email: string,
    redirectTo: string,
    userMetadata?: Record<string, unknown>,
  ): Promise<string> {
    const { signInUrl, kind } = await this.generateAuthLink(
      email,
      redirectTo,
      userMetadata,
      ['magiclink', 'invite'],
    )
    this.logger.warn(`[DEV] Sign-in link for ${email} (${kind}):\n${signInUrl}`)
    return signInUrl
  }

  /**
   * Notify an existing client they were added to another org (not an Auth invite).
   * Best-effort: never throws — invite/attach still succeeds if email fails.
   */
  async notifyExistingClientAddedToOrg(params: {
    email: string
    organizationName: string
    roleLabel: string
    portalUrl: string
  }): Promise<'sent' | 'dev' | 'skipped'> {
    if (this.useDevSignInLinks()) {
      this.logger.warn(
        `[DEV] Membership added for ${params.email} → ${params.organizationName} (${params.roleLabel}). Portal: ${params.portalUrl}`,
      )
      return 'dev'
    }

    try {
      return await this.resendMail.sendMembershipAddedEmail({
        to: params.email,
        organizationName: params.organizationName,
        roleLabel: params.roleLabel,
        portalUrl: params.portalUrl,
      })
    } catch (err) {
      this.logger.error(
        `Failed to send membership-added email to ${params.email}`,
        err instanceof Error ? err.stack : err,
      )
      return 'skipped'
    }
  }

  async inviteUserByEmail(payload: SupabaseInvitePayload): Promise<SupabaseInviteResult> {
    if (!this.adminClient) {
      this.logger.warn(
        `Supabase not configured — stub invite for ${payload.email}`,
      )
      return { invitationId: `stub_${Date.now()}`, status: 'stubbed' }
    }

    const redirectTo = payload.redirectTo ?? ''
    const metadata = {
      organizationId: payload.organizationId,
      organizationSlug: payload.organizationSlug,
      role: 'CLIENT',
    }

    if (this.useDevSignInLinks() && redirectTo) {
      this.logger.log(
        `[invite] AUTH_DEV_LINKS=true — generating link without email for ${payload.email}`,
      )
      const devSignInUrl = await this.generateDevSignInLink(
        payload.email,
        redirectTo,
        metadata,
      )
      return {
        invitationId: `dev_${Date.now()}`,
        status: 'dev_link',
        devSignInUrl,
      }
    }

    if (this.useResendApi() && redirectTo) {
      const inviteCopy =
        payload.projectTitle && payload.inviteContext
          ? {
              projectTitle: payload.projectTitle,
              organizationName: payload.organizationName,
              inviteContext: payload.inviteContext,
            }
          : undefined
      const { userId } = await this.sendAuthEmail(
        payload.email,
        redirectTo,
        metadata,
        ['invite', 'magiclink'],
        inviteCopy,
      )
      return { invitationId: userId, status: 'sent' }
    }

    this.logger.log(
      `[invite] Sending Supabase invite email (SMTP) to ${payload.email}`,
    )
    const { data, error } = await this.adminClient.auth.admin.inviteUserByEmail(
      payload.email,
      {
        redirectTo,
        data: metadata,
      },
    )

    if (error) {
      this.throwAuthError(error, `inviteUserByEmail(${payload.email})`)
    }

    return {
      invitationId: data.user.id,
      status: 'sent',
    }
  }

  async sendMagicLink(email: string, redirectTo: string): Promise<MagicLinkResult> {
    if (!this.adminClient && !this.publicClient) {
      this.logger.warn(`Supabase not configured — stub magic link for ${email}`)
      return { status: 'stubbed' }
    }

    if (this.useDevSignInLinks()) {
      const devSignInUrl = await this.generateDevSignInLink(email, redirectTo)
      return { status: 'dev_link', devSignInUrl }
    }

    if (this.useResendApi()) {
      await this.sendAuthEmail(email, redirectTo, undefined, ['magiclink', 'invite'])
      return { status: 'sent' }
    }

    if (!this.publicClient) {
      throw new BadRequestException('Supabase public client is not configured')
    }

    const { error } = await this.publicClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    })

    if (error) {
      this.throwAuthError(error, `signInWithOtp(${email})`)
    }

    return { status: 'sent' }
  }

  async sendAllowlistedMagicLink(
    email: string,
    redirectTo: string,
    userMetadata?: Record<string, unknown>,
  ): Promise<MagicLinkResult> {
    if (this.useDevSignInLinks()) {
      const devSignInUrl = await this.generateDevSignInLink(
        email,
        redirectTo,
        userMetadata,
      )
      return { status: 'dev_link', devSignInUrl }
    }

    if (this.useResendApi()) {
      await this.sendAuthEmail(email, redirectTo, userMetadata, [
        'magiclink',
        'invite',
      ])
      return { status: 'sent' }
    }

    if (!this.adminClient) {
      return this.sendMagicLink(email, redirectTo)
    }

    const invite = await this.adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: userMetadata,
    })

    if (!invite.error) {
      return { status: 'sent' }
    }

    const msg = invite.error.message.toLowerCase()
    const userAlreadyExists =
      msg.includes('already') ||
      msg.includes('registered') ||
      msg.includes('exists')

    if (userAlreadyExists) {
      return this.sendMagicLink(email, redirectTo)
    }

    this.throwAuthError(invite.error, `inviteUserByEmail(${email})`)
  }
}
