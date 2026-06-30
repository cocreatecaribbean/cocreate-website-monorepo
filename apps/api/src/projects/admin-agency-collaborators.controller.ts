import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  InviteAgencyCollaboratorSchema,
  type InviteAgencyCollaboratorInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { isAgencyAdminRole } from '../auth/admin-roles'
import { ForbiddenException } from '@nestjs/common'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { AgencyCollaboratorsService } from './agency-collaborators.service'

@Controller({ path: 'admin/projects/:projectId/collaborators', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminAgencyCollaboratorsController {
  constructor(private readonly collaborators: AgencyCollaboratorsService) {}

  private requireCoreTeam(req: AdminRequest) {
    if (!req.adminUser) throw new UnauthorizedException('Session required')
    if (!isAgencyAdminRole(req.adminUser.role)) {
      throw new ForbiddenException('Core team access required')
    }
    return req.adminUser
  }

  @Get()
  list(@Req() req: AdminRequest, @Param('projectId') projectId: string) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.listForProject(actor, projectId)
  }

  @Post()
  invite(
    @Req() req: AdminRequest,
    @Param('projectId') projectId: string,
    @Body(zodBody(InviteAgencyCollaboratorSchema)) body: InviteAgencyCollaboratorInput,
  ) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.inviteToProject(actor, projectId, {
      email: body.email,
      userId: body.userId,
    })
  }

  @Delete(':userId')
  remove(
    @Req() req: AdminRequest,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.removeFromProject(actor, projectId, userId)
  }
}
