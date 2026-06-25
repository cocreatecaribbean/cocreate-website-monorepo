import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { ClientsService } from './clients.service'
import { ClientLogoStorageService } from './client-logo-storage.service'
import { InviteClientDto } from './dto/invite-client.dto'
import { LogoUploadUrlDto } from './dto/logo-upload-url.dto'
import { UpdateBrand24ProjectDto } from './dto/update-brand24-project.dto'
import { UpdateSocialListeningDto } from './dto/update-social-listening.dto'

@Controller({ path: 'admin/clients', version: '1' })
@UseGuards(AdminAuthGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly logoStorage: ClientLogoStorageService,
  ) {}

  @Post('logo/upload-url')
  logoUploadUrl(@Body() dto: LogoUploadUrlDto) {
    return this.logoStorage.createUploadUrl(dto)
  }

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
