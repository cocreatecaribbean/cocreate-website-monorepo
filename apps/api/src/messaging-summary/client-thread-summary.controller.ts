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
import {
  ClientAuthGuard,
  type ClientPortalRequest,
} from '../auth/guards/client-auth.guard'
import { MessagingSummaryService } from './messaging-summary.service'

@Controller({ path: 'client-portal', version: '1' })
@UseGuards(ClientAuthGuard)
export class ClientThreadSummaryController {
  constructor(private readonly summaries: MessagingSummaryService) {}

  @Post('project-requests/:requestId/summary')
  generateProjectSummary(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Query('force') force?: string,
  ) {
    return this.summaries.generateProjectRequestSummary(
      req.clientUser!,
      requestId,
      { force: force === 'true' },
    )
  }

  @Get('project-requests/:requestId/summary/export')
  async exportProjectSummary(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Query('force') force: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.summaries.exportProjectRequestSummaryPdf(
        req.clientUser!,
        requestId,
        { force: force === 'true' },
      )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }

  @Post('inbox/conversations/:conversationId/summary')
  generateInboxSummary(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
    @Query('force') force?: string,
  ) {
    return this.summaries.generateOrgInboxSummary(req.clientUser!, conversationId, {
      force: force === 'true' },
    )
  }

  @Get('inbox/conversations/:conversationId/summary/export')
  async exportInboxSummary(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
    @Query('force') force: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.summaries.exportOrgInboxSummaryPdf(
      req.clientUser!,
      conversationId,
      { force: force === 'true' },
    )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }
}
