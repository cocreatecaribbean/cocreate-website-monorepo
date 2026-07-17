import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import type { Response } from 'express'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { ClientLogoStorageService } from '../clients/client-logo-storage.service'
import { SocialListeningReportService } from '../social-listening/social-listening-report.service'
import { SocialListeningService } from '../social-listening/social-listening.service'
import {
  CreateListeningSetupSchema,
  type CreateListeningSetupInput,
} from '@cocreate/api-contracts/v1/requests/social-listening'
import {
  LogoUploadUrlSchema,
  type LogoUploadUrlInput,
  UpdateOrganizationLogoSchema,
  type UpdateOrganizationLogoInput,
} from '@cocreate/api-contracts/v1/requests/clients'
import {
  AvatarUploadUrlSchema,
  type AvatarUploadUrlInput,
  RegisterAvatarSchema,
  type RegisterAvatarInput,
  UpdateClientProfileSchema,
  type UpdateClientProfileInput,
  UpdateUserPreferencesSchema,
  type UpdateUserPreferencesInput,
} from '@cocreate/api-contracts/v1/requests/users'
import {
  SetActiveOrganizationSchema,
  type SetActiveOrganizationInput,
} from '@cocreate/api-contracts/v1/requests/users'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { TenantScopeInterceptor } from '../prisma/tenant-scope.interceptor'
import { ClientPortalService } from './client-portal.service'

@Controller({ path: 'client-portal', version: '1' })
@UseInterceptors(TenantScopeInterceptor)
export class ClientPortalController {
  constructor(
    private readonly clientPortalService: ClientPortalService,
    private readonly socialListeningService: SocialListeningService,
    private readonly socialListeningReports: SocialListeningReportService,
    private readonly logoStorage: ClientLogoStorageService,
  ) {}

  @Get('me')
  @UseGuards(ClientAuthGuard)
  me(@Req() request: ClientPortalRequest) {
    return this.clientPortalService.getSessionProfile(request.clientUser!)
  }

  @Patch('preferences')
  @UseGuards(ClientAuthGuard)
  updatePreferences(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(UpdateUserPreferencesSchema)) body: UpdateUserPreferencesInput,
  ) {
    return this.clientPortalService.updatePreferences(request.clientUser!, body)
  }

  @Post('organization/logo/upload-url')
  @UseGuards(ClientAuthGuard)
  organizationLogoUploadUrl(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(LogoUploadUrlSchema)) body: LogoUploadUrlInput,
  ) {
    return this.clientPortalService.createOrganizationLogoUploadUrl(
      request.clientUser!,
      this.logoStorage,
      body,
    )
  }

  @Patch('organization/logo')
  @UseGuards(ClientAuthGuard)
  updateOrganizationLogo(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(UpdateOrganizationLogoSchema)) body: UpdateOrganizationLogoInput,
  ) {
    return this.clientPortalService.updateOrganizationLogo(
      request.clientUser!,
      this.logoStorage,
      body,
    )
  }

  @Delete('organization/logo')
  @UseGuards(ClientAuthGuard)
  clearOrganizationLogo(@Req() request: ClientPortalRequest) {
    return this.clientPortalService.clearOrganizationLogo(request.clientUser!)
  }

  @Patch('profile')
  @UseGuards(ClientAuthGuard)
  updateProfile(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(UpdateClientProfileSchema)) body: UpdateClientProfileInput,
  ) {
    return this.clientPortalService.updateClientProfile(request.clientUser!, body)
  }

  @Post('profile/avatar/upload-url')
  @UseGuards(ClientAuthGuard)
  clientAvatarUploadUrl(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(AvatarUploadUrlSchema)) body: AvatarUploadUrlInput,
  ) {
    return this.clientPortalService.createClientAvatarUploadUrl(
      request.clientUser!,
      body,
    )
  }

  @Patch('profile/avatar')
  @UseGuards(ClientAuthGuard)
  registerClientAvatar(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(RegisterAvatarSchema)) body: RegisterAvatarInput,
  ) {
    return this.clientPortalService.registerClientAvatar(request.clientUser!, body)
  }

  @Delete('profile/avatar')
  @UseGuards(ClientAuthGuard)
  deleteClientAvatar(@Req() request: ClientPortalRequest) {
    return this.clientPortalService.deleteClientAvatar(request.clientUser!)
  }

  @Post('social-listening/setup')
  @UseGuards(ClientAuthGuard)
  createSocialListeningSetup(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(CreateListeningSetupSchema)) body: CreateListeningSetupInput,
  ) {
    return this.socialListeningService.createListeningSetupForClient(
      request.clientUser!,
      body,
    )
  }

  @Get('social-listening/analytics')
  @UseGuards(ClientAuthGuard)
  socialListeningAnalytics(
    @Req() request: ClientPortalRequest,
    @Query('asOf') asOf?: string,
  ) {
    return this.socialListeningService.getAnalyticsForClient(
      request.clientUser!,
      asOf,
    )
  }

  @Get('social-listening/analytics/snapshots')
  @UseGuards(ClientAuthGuard)
  socialListeningSnapshotDates(
    @Req() request: ClientPortalRequest,
    @Query('limit') limit?: string,
  ) {
    return this.socialListeningService.listSnapshotDatesForClient(
      request.clientUser!,
      limit ? Number.parseInt(limit, 10) : undefined,
    )
  }

  @Get('social-listening/reports/templates')
  @UseGuards(ClientAuthGuard)
  socialListeningReportTemplates(@Req() request: ClientPortalRequest) {
    return this.socialListeningReports.listTemplatesForClient(request.clientUser!)
  }

  @Post('social-listening/reports/generate')
  @UseGuards(ClientAuthGuard)
  async socialListeningGenerateReport(
    @Req() request: ClientPortalRequest,
    @Res() res: Response,
    @Query('templateId') templateId: string,
    @Query('asOf') asOf?: string,
    @Query('baseline') baseline?: string,
    @Query('current') current?: string,
  ) {
    const { buffer, filename } =
      await this.socialListeningReports.generatePdfForClient(
        request.clientUser!,
        templateId,
        asOf,
        baseline,
        current,
      )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }

  @Get('social-listening/analytics/compare')
  @UseGuards(ClientAuthGuard)
  socialListeningCompare(
    @Req() request: ClientPortalRequest,
    @Query('baseline') baseline: string,
    @Query('current') current?: string,
  ) {
    return this.socialListeningService.compareForClient(
      request.clientUser!,
      baseline,
      current,
    )
  }

  /** @deprecated Use POST /client-portal/magic-link */
  @Post('login')
  login(@Body() body: { email?: string }) {
    const email = body?.email ?? ''
    if (!email.trim()) {
      return {
        ok: false as const,
        message: 'Please enter your email address.',
      }
    }
    return this.clientPortalService.validateLogin(email)
  }

  @Post('magic-link')
  requestMagicLink(@Body() body: { email?: string }) {
    const email = body?.email ?? ''
    if (!email.trim()) {
      return {
        ok: false as const,
        message: 'Please enter your email address.',
      }
    }
    return this.clientPortalService.requestMagicLink(email)
  }

  @Post('session/sync')
  syncSession(
    @Body() body: { accessToken?: string; organizationId?: string },
  ) {
    const accessToken = body?.accessToken ?? ''
    if (!accessToken.trim()) {
      return { ok: false as const, message: 'Missing access token' }
    }
    return this.clientPortalService.syncSession(
      accessToken,
      body?.organizationId ?? null,
    )
  }

  @Post('active-organization')
  @UseGuards(ClientAuthGuard)
  setActiveOrganization(
    @Req() request: ClientPortalRequest,
    @Body(zodBody(SetActiveOrganizationSchema)) body: SetActiveOrganizationInput,
  ) {
    const bearer = request.headers.authorization ?? ''
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : ''
    return this.clientPortalService.setActiveOrganization(
      token,
      body.organizationId,
    )
  }
}
