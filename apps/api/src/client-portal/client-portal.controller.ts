import { Body, Controller, Post } from '@nestjs/common'
import { ClientPortalService } from './client-portal.service'

@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

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
}
