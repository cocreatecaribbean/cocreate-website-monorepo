import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ClientAuthGuard, type ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { ClientOwnerGuard } from '../auth/guards/client-owner.guard'
import { ClientTeamHubGuard } from '../auth/guards/client-team-hub.guard'
import { ClientTeamService } from './client-team.service'
import { InviteTeamMemberDto } from './dto/invite-team-member.dto'
import { UpdateTeamMemberDto } from './dto/update-team-member.dto'
import { AddProjectMemberDto } from './dto/add-project-member.dto'
import { RequestTeamInviteDto } from './dto/request-team-invite.dto'

@Controller({ path: 'client-portal', version: '1' })
@UseGuards(ClientAuthGuard)
export class ClientTeamController {
  constructor(private readonly team: ClientTeamService) {}

  @Get('team')
  @UseGuards(ClientTeamHubGuard)
  listTeam(@Req() request: ClientPortalRequest) {
    return this.team.listOrgTeamForClient(request.clientUser!)
  }

  @Get('team/hub')
  @UseGuards(ClientTeamHubGuard)
  getTeamHub(@Req() request: ClientPortalRequest) {
    return this.team.getTeamHubForClient(request.clientUser!)
  }

  @Post('team/invite')
  @UseGuards(ClientOwnerGuard)
  inviteTeamMember(
    @Req() request: ClientPortalRequest,
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.team.inviteToOrganizationAsClient(request.clientUser!, dto)
  }

  @Post('team/invite-requests')
  @UseGuards(ClientTeamHubGuard)
  requestTeamInvite(
    @Req() request: ClientPortalRequest,
    @Body() dto: RequestTeamInviteDto,
  ) {
    return this.team.requestOrgInviteAsProjectManager(request.clientUser!, dto)
  }

  @Patch('team/:userId')
  @UseGuards(ClientTeamHubGuard)
  updateTeamMember(
    @Req() request: ClientPortalRequest,
    @Param('userId') userId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.team.updateTeamMemberAsClient(request.clientUser!, userId, dto)
  }

  @Get('projects/:projectId/members')
  listProjectMembers(
    @Req() request: ClientPortalRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.team.listProjectMembers(request.clientUser!, projectId)
  }

  @Post('projects/:projectId/members')
  addProjectMember(
    @Req() request: ClientPortalRequest,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.team.addProjectMember(request.clientUser!, projectId, dto)
  }

  @Delete('projects/:projectId/members/:userId')
  removeProjectMember(
    @Req() request: ClientPortalRequest,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.team.removeProjectMember(request.clientUser!, projectId, userId)
  }
}
