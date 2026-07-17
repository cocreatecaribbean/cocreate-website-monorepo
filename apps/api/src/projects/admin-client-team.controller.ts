import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ClientTeamInviteRequestStatus } from '@cocreate/database'
import {
  AddProjectMemberSchema,
  type AddProjectMemberInput,
  InviteTeamMemberSchema,
  type InviteTeamMemberInput,
  RejectTeamInviteSchema,
  type RejectTeamInviteInput,
  TransferProjectOwnershipSchema,
  type TransferProjectOwnershipInput,
  UpdateTeamMemberSchema,
  type UpdateTeamMemberInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { ClientTeamService } from './client-team.service'

@Controller({ path: 'admin/clients/organizations/:organizationId', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminClientTeamController {
  constructor(private readonly team: ClientTeamService) {}

  @Get('team')
  listTeam(@Param('organizationId') organizationId: string) {
    return this.team.listOrgTeamForAdmin(organizationId)
  }

  @Post('team/invite')
  inviteTeamMember(
    @Req() request: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Body(zodBody(InviteTeamMemberSchema)) body: InviteTeamMemberInput,
  ) {
    return this.team.inviteToOrganizationAsAdmin(
      request.adminUser!,
      organizationId,
      body,
    )
  }

  @Patch('team/:userId')
  updateTeamMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body(zodBody(UpdateTeamMemberSchema)) body: UpdateTeamMemberInput,
  ) {
    return this.team.updateTeamMemberAsAdmin(organizationId, userId, body)
  }

  @Delete('team/:userId')
  removeTeamMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.team.suspendTeamMember(organizationId, userId)
  }

  @Post('team/:userId/suspend')
  suspendTeamMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.team.suspendTeamMember(organizationId, userId)
  }

  @Get('team/invite-requests')
  listInviteRequests(
    @Param('organizationId') organizationId: string,
    @Query('status') status?: string,
  ) {
    const parsed =
      status === 'PENDING' ||
      status === 'APPROVED' ||
      status === 'REJECTED' ||
      status === 'CANCELLED'
        ? (status as ClientTeamInviteRequestStatus)
        : undefined
    return this.team.listInviteRequestsForAdmin(organizationId, parsed)
  }

  @Post('team/invite-requests/:requestId/approve')
  approveInviteRequest(
    @Req() request: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.team.approveInviteRequest(
      request.adminUser!,
      organizationId,
      requestId,
    )
  }

  @Post('team/invite-requests/:requestId/reject')
  rejectInviteRequest(
    @Req() request: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Param('requestId') requestId: string,
    @Body(zodBody(RejectTeamInviteSchema)) body: RejectTeamInviteInput,
  ) {
    return this.team.rejectInviteRequest(
      request.adminUser!,
      organizationId,
      requestId,
      body,
    )
  }

  @Get('projects/:projectId/members')
  listProjectMembers(@Param('projectId') projectId: string) {
    return this.team.listProjectMembersForAdmin(projectId)
  }

  @Post('projects/:projectId/members')
  addProjectMember(
    @Param('projectId') projectId: string,
    @Body(zodBody(AddProjectMemberSchema)) body: AddProjectMemberInput,
  ) {
    return this.team.addProjectMemberAsAdmin(projectId, body)
  }

  @Delete('projects/:projectId/members/:userId')
  removeProjectMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.team.removeProjectMemberAsAdmin(projectId, userId)
  }

  @Patch('projects/:projectId/owner')
  transferProjectOwnership(
    @Param('projectId') projectId: string,
    @Body(zodBody(TransferProjectOwnershipSchema))
    body: TransferProjectOwnershipInput,
  ) {
    return this.team.transferProjectOwnershipAsAdmin(projectId, body)
  }
}
