import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ClientTeamInviteRequestStatus } from '@cocreate/database'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { ClientTeamService } from './client-team.service'
import { InviteTeamMemberDto } from './dto/invite-team-member.dto'
import { UpdateTeamMemberDto } from './dto/update-team-member.dto'
import { RejectTeamInviteDto } from './dto/reject-team-invite.dto'

@Controller('admin/clients/organizations/:organizationId')
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
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.team.inviteToOrganizationAsAdmin(
      request.adminUser!,
      organizationId,
      dto,
    )
  }

  @Patch('team/:userId')
  updateTeamMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.team.updateTeamMemberAsAdmin(organizationId, userId, dto)
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
    @Body() dto: RejectTeamInviteDto,
  ) {
    return this.team.rejectInviteRequest(
      request.adminUser!,
      organizationId,
      requestId,
      dto,
    )
  }
}
