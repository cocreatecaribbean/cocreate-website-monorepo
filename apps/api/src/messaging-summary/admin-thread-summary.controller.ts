import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { MessagingSummaryService } from './messaging-summary.service'

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminThreadSummaryController {
  constructor(private readonly summaries: MessagingSummaryService) {}

  private actor(req: AdminRequest) {
    return req.adminUser!
  }

  @Post('project-requests/:requestId/summary')
  generateProjectSummary(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Query('force') force?: string,
  ) {
    return this.summaries.generateProjectRequestSummary(
      this.actor(req),
      requestId,
      { force: force === 'true' },
    )
  }

  @Get('project-requests/:requestId/summary/export')
  async exportProjectSummary(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Query('force') force: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.summaries.exportProjectRequestSummaryPdf(
        this.actor(req),
        requestId,
        { force: force === 'true' },
      )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }

  @Post('inbox/conversations/:conversationId/summary')
  generateInboxSummary(
    @Req() req: AdminRequest,
    @Param('conversationId') conversationId: string,
    @Query('force') force?: string,
  ) {
    return this.summaries.generateOrgInboxSummary(this.actor(req), conversationId, {
      force: force === 'true',
    })
  }

  @Get('inbox/conversations/:conversationId/summary/export')
  async exportInboxSummary(
    @Req() req: AdminRequest,
    @Param('conversationId') conversationId: string,
    @Query('force') force: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.summaries.exportOrgInboxSummaryPdf(
      this.actor(req),
      conversationId,
      { force: force === 'true' },
    )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }
}
