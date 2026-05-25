import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { AdminsService } from './admins.service'

@Controller('admin/admins')
@UseGuards(AdminAuthGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  list() {
    return this.adminsService.listAdmins()
  }

  @Post('invite')
  invite(@Body() body: { email?: string }) {
    const email = body?.email?.trim() ?? ''
    if (!email) {
      return { ok: false as const, message: 'Email is required' }
    }
    return this.adminsService.inviteAdmin(email)
  }

  @Post(':userId/suspend')
  suspend(@Param('userId') userId: string) {
    return this.adminsService.suspendAdmin(userId)
  }
}
