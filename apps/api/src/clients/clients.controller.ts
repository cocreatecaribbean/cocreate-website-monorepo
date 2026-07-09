import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import {
  InviteClientSchema,
  type InviteClientInput,
  LogoUploadUrlSchema,
  type LogoUploadUrlInput,
  UpdateBrand24ProjectSchema,
  type UpdateBrand24ProjectInput,
  UpdateOrganizationLogoSchema,
  type UpdateOrganizationLogoInput,
  UpdateSocialListeningSchema,
  type UpdateSocialListeningInput,
} from '@cocreate/api-contracts/v1/requests/clients'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { ClientsService } from './clients.service'
import { ClientLogoStorageService } from './client-logo-storage.service'

@Controller({ path: 'admin/clients', version: '1' })
@UseGuards(AdminAuthGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly logoStorage: ClientLogoStorageService,
  ) {}

  @Post('logo/upload-url')
  logoUploadUrl(@Body(zodBody(LogoUploadUrlSchema)) body: LogoUploadUrlInput) {
    return this.logoStorage.createUploadUrl(body)
  }

  @Post(':organizationId/logo/upload-url')
  organizationLogoUploadUrl(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(LogoUploadUrlSchema)) body: LogoUploadUrlInput,
  ) {
    void organizationId
    return this.logoStorage.createUploadUrl(body)
  }

  @Patch(':organizationId/logo')
  async updateOrganizationLogo(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(UpdateOrganizationLogoSchema)) body: UpdateOrganizationLogoInput,
  ) {
    const logoUrl = body.storagePath?.trim()
      ? this.logoStorage.publicUrlForPath(body.storagePath.trim())
      : body.logoUrl!.trim()
    const organization = await this.clientsService.updateOrganizationLogo(
      organizationId,
      logoUrl,
    )
    return { ok: true as const, organization }
  }

  @Delete(':organizationId/logo')
  async clearOrganizationLogo(@Param('organizationId') organizationId: string) {
    const organization = await this.clientsService.clearOrganizationLogo(organizationId)
    return { ok: true as const, organization }
  }

  @Post('invite')
  invite(@Body(zodBody(InviteClientSchema)) body: InviteClientInput) {
    return this.clientsService.inviteClient(body)
  }

  @Get()
  list() {
    return this.clientsService.listClientRoster()
  }

  @Get(':organizationId')
  getOne(@Param('organizationId') organizationId: string) {
    return this.clientsService.getClientRosterItem(organizationId)
  }

  @Patch('organizations/:organizationId/social-listening')
  updateSocialListening(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(UpdateSocialListeningSchema)) body: UpdateSocialListeningInput,
  ) {
    return this.clientsService.updateSocialListeningSubscription(
      organizationId,
      body.enabled,
    )
  }

  @Patch('organizations/:organizationId/brand24-project')
  updateBrand24Project(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(UpdateBrand24ProjectSchema)) body: UpdateBrand24ProjectInput,
  ) {
    return this.clientsService.updateBrand24Project(
      organizationId,
      body.brand24ProjectId,
    )
  }

  @Post('users/:userId/suspend')
  suspend(@Param('userId') userId: string) {
    return this.clientsService.suspendClientUser(userId)
  }
}
