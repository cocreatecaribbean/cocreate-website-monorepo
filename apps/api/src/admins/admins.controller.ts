import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { SuperAdminGuard } from '../auth/guards/super-admin.guard'
import { AdminsService } from './admins.service'
import { UpdateAdminRoleDto } from '../users/dto/update-admin-role.dto'

@Controller({ path: 'admin/admins', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  list() {
    return this.adminsService.listAdmins()
  }

  @Post('invite')
  @UseGuards(SuperAdminGuard)
  invite(@Req() request: AdminRequest, @Body() body: { email?: string }) {
    const email = body?.email?.trim() ?? ''
    if (!email) {
      return { ok: false as const, message: 'Email is required' }
    }
    if (!request.adminUser) {
      return { ok: false as const, message: 'Not authenticated' }
    }
    return this.adminsService.inviteAdmin(request.adminUser, email)
  }

  @Post(':userId/suspend')
  @UseGuards(SuperAdminGuard)
  suspend(@Req() request: AdminRequest, @Param('userId') userId: string) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Not authenticated' }
    }
    return this.adminsService.suspendAdmin(request.adminUser, userId)
  }

  @Patch(':userId/role')
  @UseGuards(SuperAdminGuard)
  updateRole(
    @Req() request: AdminRequest,
    @Param('userId') userId: string,
    @Body() body: UpdateAdminRoleDto,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Not authenticated' }
    }
    return this.adminsService.updateAdminRole(
      request.adminUser,
      userId,
      body.role,
    )
  }
}
