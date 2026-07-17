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
import {
  AddProjectMemberSchema,
  type AddProjectMemberInput,
  InviteTeamMemberSchema,
  type InviteTeamMemberInput,
  RequestTeamInviteSchema,
  type RequestTeamInviteInput,
  TransferProjectOwnershipSchema,
  type TransferProjectOwnershipInput,
  UpdateTeamMemberSchema,
  type UpdateTeamMemberInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { ClientAuthGuard, type ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { ClientOwnerGuard } from '../auth/guards/client-owner.guard'
import { ClientTeamHubGuard } from '../auth/guards/client-team-hub.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { ClientTeamService } from './client-team.service'

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
    @Body(zodBody(InviteTeamMemberSchema)) body: InviteTeamMemberInput,
  ) {
    return this.team.inviteToOrganizationAsClient(request.clientUser!, body)
  }

  @Post('team/invite-requests')
  @UseGuards(ClientTeamHubGuard)
  requestTeamInvite(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(RequestTeamInviteSchema)) body: RequestTeamInviteInput,
  ) {
    return this.team.requestOrgInviteAsProjectManager(request.clientUser!, body)
  }

  @Patch('team/:userId')
  @UseGuards(ClientTeamHubGuard)
  updateTeamMember(
    @Req() request: ClientPortalRequest,
    @Param('userId') userId: string,
    @Body(zodBody(UpdateTeamMemberSchema)) body: UpdateTeamMemberInput,
  ) {
    return this.team.updateTeamMemberAsClient(request.clientUser!, userId, body)
  }

  @Delete('team/:userId')
  @UseGuards(ClientOwnerGuard)
  removeTeamMember(
    @Req() request: ClientPortalRequest,
    @Param('userId') userId: string,
  ) {
    return this.team.removeOrgMembershipAsClient(request.clientUser!, userId)
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
    @Body(zodBody(AddProjectMemberSchema)) body: AddProjectMemberInput,
  ) {
    return this.team.addProjectMember(request.clientUser!, projectId, body)
  }

  @Delete('projects/:projectId/members/:userId')
  removeProjectMember(
    @Req() request: ClientPortalRequest,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.team.removeProjectMember(request.clientUser!, projectId, userId)
  }

  @Patch('projects/:projectId/owner')
  transferProjectOwnership(
    @Req() request: ClientPortalRequest,
    @Param('projectId') projectId: string,
    @Body(zodBody(TransferProjectOwnershipSchema))
    body: TransferProjectOwnershipInput,
  ) {
    return this.team.transferProjectOwnership(request.clientUser!, projectId, body)
  }
}
