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
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { isAgencyAdminRole } from '../auth/admin-roles'
import { ForbiddenException } from '@nestjs/common'
import { AgencyCollaboratorsService } from './agency-collaborators.service'
import { InviteAgencyCollaboratorDto } from './dto/invite-agency-collaborator.dto'

@Controller('admin/projects/:projectId/collaborators')
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
    @Body() dto: InviteAgencyCollaboratorDto,
  ) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.inviteToProject(actor, projectId, {
      email: dto.email,
      userId: dto.userId,
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
