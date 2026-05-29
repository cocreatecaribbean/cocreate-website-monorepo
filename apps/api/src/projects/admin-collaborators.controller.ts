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
import { CreateAgencyCollaboratorDto } from './dto/invite-agency-collaborator.dto'

@Controller('admin/collaborators')
@UseGuards(AdminAuthGuard)
export class AdminCollaboratorsController {
  constructor(private readonly collaborators: AgencyCollaboratorsService) {}

  private requireCoreTeam(req: AdminRequest) {
    if (!req.adminUser) throw new UnauthorizedException('Session required')
    if (!isAgencyAdminRole(req.adminUser.role)) {
      throw new ForbiddenException('Core team access required')
    }
    return req.adminUser
  }

  @Get()
  list(@Req() req: AdminRequest) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.listAll(actor)
  }

  @Post()
  create(@Req() req: AdminRequest, @Body() dto: CreateAgencyCollaboratorDto) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.createFromRoster(
      actor,
      dto.email,
      dto.projectIds ?? [],
    )
  }

  @Post(':userId/resend-invite')
  resendInvite(@Req() req: AdminRequest, @Param('userId') userId: string) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.resendInvite(actor, userId)
  }

  @Post(':userId/projects/:projectId')
  assignToProject(
    @Req() req: AdminRequest,
    @Param('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.assignExistingToProject(actor, projectId, userId)
  }

  @Delete(':userId/projects/:projectId')
  removeFromProject(
    @Req() req: AdminRequest,
    @Param('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.removeFromProject(actor, projectId, userId)
  }

  @Delete(':userId')
  removeFromAgency(@Req() req: AdminRequest, @Param('userId') userId: string) {
    const actor = this.requireCoreTeam(req)
    return this.collaborators.removeFromAgency(actor, userId)
  }
}
