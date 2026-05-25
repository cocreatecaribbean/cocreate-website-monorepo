import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { SocialListeningService } from '../social-listening/social-listening.service'
import { ClientPortalService } from './client-portal.service'

@Controller('client-portal')
export class ClientPortalController {
  constructor(
    private readonly clientPortalService: ClientPortalService,
    private readonly socialListeningService: SocialListeningService,
  ) {}

  @Get('me')
  @UseGuards(ClientAuthGuard)
  me(@Req() request: ClientPortalRequest) {
    return this.clientPortalService.getSessionProfile(request.clientUser!)
  }

  @Get('social-listening/analytics')
  @UseGuards(ClientAuthGuard)
  socialListeningAnalytics(@Req() request: ClientPortalRequest) {
    return this.socialListeningService.getAnalyticsForClient(request.clientUser!)
  }

  /** @deprecated Use POST /client-portal/magic-link */
  @Post('login')
  login(@Body() body: { email?: string }) {
    const email = body?.email ?? ''
    if (!email.trim()) {
      return {
        ok: false as const,
        message: 'Please enter your email address.',
      }
    }
    return this.clientPortalService.validateLogin(email)
  }

  @Post('magic-link')
  requestMagicLink(@Body() body: { email?: string }) {
    const email = body?.email ?? ''
    if (!email.trim()) {
      return {
        ok: false as const,
        message: 'Please enter your email address.',
      }
    }
    return this.clientPortalService.requestMagicLink(email)
  }

  @Post('session/sync')
  syncSession(@Body() body: { accessToken?: string }) {
    const accessToken = body?.accessToken ?? ''
    if (!accessToken.trim()) {
      return { ok: false as const, message: 'Missing access token' }
    }
    return this.clientPortalService.syncSession(accessToken)
  }
}
