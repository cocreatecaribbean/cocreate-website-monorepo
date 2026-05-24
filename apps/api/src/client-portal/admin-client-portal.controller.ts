import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ClientPortalService } from './client-portal.service'

@Controller('admin/client-portal-users')
export class AdminClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  private assertAdminKey(header?: string) {
    const expected = process.env.ADMIN_API_KEY
    if (!expected || header !== expected) {
      throw new UnauthorizedException('Invalid admin credentials')
    }
  }

  @Get()
  list(@Headers('x-admin-key') adminKey?: string) {
    this.assertAdminKey(adminKey)
    return this.clientPortalService.listUsers()
  }

  @Post()
  assign(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body() body: { email?: string },
  ) {
    this.assertAdminKey(adminKey)
    const email = body?.email ?? ''
    if (!email.trim()) {
      return { error: 'Email is required' }
    }
    return this.clientPortalService.assignUser(email)
  }

  @Post(':id/deactivate')
  deactivate(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Param('id') id: string,
  ) {
    this.assertAdminKey(adminKey)
    return this.clientPortalService.deactivateUser(id)
  }
}
