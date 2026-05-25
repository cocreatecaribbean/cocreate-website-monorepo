import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { ClientsService } from './clients.service'
import { InviteClientDto } from './dto/invite-client.dto'
import { UpdateBrand24ProjectDto } from './dto/update-brand24-project.dto'
import { UpdateSocialListeningDto } from './dto/update-social-listening.dto'

@Controller('admin/clients')
@UseGuards(AdminAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('invite')
  invite(@Body() dto: InviteClientDto) {
    return this.clientsService.inviteClient(dto)
  }

  @Get()
  list() {
    return this.clientsService.listClientRoster()
  }

  @Patch('organizations/:organizationId/social-listening')
  updateSocialListening(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateSocialListeningDto,
  ) {
    return this.clientsService.updateSocialListeningSubscription(
      organizationId,
      dto.enabled,
    )
  }

  @Patch('organizations/:organizationId/brand24-project')
  updateBrand24Project(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateBrand24ProjectDto,
  ) {
    return this.clientsService.updateBrand24Project(
      organizationId,
      dto.brand24ProjectId,
    )
  }

  @Post('users/:userId/suspend')
  suspend(@Param('userId') userId: string) {
    return this.clientsService.suspendClientUser(userId)
  }
}
