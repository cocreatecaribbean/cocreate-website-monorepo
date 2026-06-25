import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { SocialListeningReportService } from '../social-listening/social-listening-report.service'
import { SocialListeningService } from '../social-listening/social-listening.service'
import { CreateListeningSetupDto } from '../social-listening/dto/create-listening-setup.dto'
import { ClientPortalService } from './client-portal.service'

@Controller({ path: 'client-portal', version: '1' })
export class ClientPortalController {
  constructor(
    private readonly clientPortalService: ClientPortalService,
    private readonly socialListeningService: SocialListeningService,
    private readonly socialListeningReports: SocialListeningReportService,
  ) {}

  @Get('me')
  @UseGuards(ClientAuthGuard)
  me(@Req() request: ClientPortalRequest) {
    return this.clientPortalService.getSessionProfile(request.clientUser!)
  }

  @Post('social-listening/setup')
  @UseGuards(ClientAuthGuard)
  createSocialListeningSetup(
    @Req() request: ClientPortalRequest,
    @Body() dto: CreateListeningSetupDto,
  ) {
    return this.socialListeningService.createListeningSetupForClient(
      request.clientUser!,
      dto,
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
  socialListeningReportTemplates() {
    return this.socialListeningReports.listTemplates()
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
  syncSession(@Body() body: { accessToken?: string }) {
    const accessToken = body?.accessToken ?? ''
    if (!accessToken.trim()) {
      return { ok: false as const, message: 'Missing access token' }
    }
    return this.clientPortalService.syncSession(accessToken)
  }
}
