import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import {
  InviteAdminSchema,
  type InviteAdminInput,
  UpdateAdminRoleSchema,
  type UpdateAdminRoleInput,
} from '@cocreate/api-contracts/v1/requests/users'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { SuperAdminGuard } from '../auth/guards/super-admin.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { AdminsService } from './admins.service'

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
  invite(
    @Req() request: AdminRequest,
    @Body(zodBody(InviteAdminSchema)) body: InviteAdminInput,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Not authenticated' }
    }
    return this.adminsService.inviteAdmin(request.adminUser, body.email)
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
    @Body(zodBody(UpdateAdminRoleSchema)) body: UpdateAdminRoleInput,
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
