import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import {
  CreateCancellationRequestSchema,
  type CreateCancellationRequestInput,
  CreateChangeRequestSchema,
  type CreateChangeRequestInput,
  CreatePhaseApprovalSchema,
  type CreatePhaseApprovalInput,
  CreateProjectSchema,
  type CreateProjectInput,
  CreateRequestMessageSchema,
  type CreateRequestMessageInput,
  MarkAttentionReadSchema,
  type MarkAttentionReadInput,
  MarkInboxReadSchema,
  type MarkInboxReadInput,
  RegisterAttachmentSchema,
  type RegisterAttachmentInput,
  RegisterCoverSchema,
  type RegisterCoverInput,
  SetFileReactionSchema,
  type SetFileReactionInput,
  TopPicksQuerySchema,
  UploadUrlSchema,
  type UploadUrlInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { ProjectsService } from './projects.service'
import { ProjectFileReactionsService } from './project-file-reactions.service'

@Controller({ path: 'client-portal', version: '1' })
@UseGuards(ClientAuthGuard)
export class ClientProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly reactions: ProjectFileReactionsService,
  ) {}

  @Get('projects')
  listProjects(
    @Req() req: ClientPortalRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined
    return this.projects.listForClient(req.clientUser!, {
      cursor: cursor?.trim() || undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    })
  }

  @Post('projects')
  createProject(
    @Req() req: ClientPortalRequest,
    @Body(zodBody(CreateProjectSchema)) body: CreateProjectInput,
  ) {
    return this.projects.createForClient(req.clientUser!, body)
  }

  @Get('top-picks')
  listOrgTopPicks(
    @Req() req: ClientPortalRequest,
    @Query() query: Record<string, string | string[] | undefined>,
  ) {
    const parsed = TopPicksQuerySchema.safeParse(query)
    const tags = parsed.success ? parsed.data.tags : []
    return this.reactions.listTopPicksForClientOrg(req.clientUser!, tags)
  }

  @Get('projects/:id/top-picks')
  listProjectTopPicks(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Query() query: Record<string, string | string[] | undefined>,
  ) {
    const parsed = TopPicksQuerySchema.safeParse(query)
    const tags = parsed.success ? parsed.data.tags : []
    return this.reactions.listTopPicksForProject(req.clientUser!, id, tags)
  }

  @Get('projects/:id/file-reactions')
  listProjectFileReactions(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
  ) {
    return this.reactions.listReactionsForProject(req.clientUser!, id)
  }

  @Put('attachments/:attachmentId/reaction')
  setAttachmentReaction(
    @Req() req: ClientPortalRequest,
    @Param('attachmentId') attachmentId: string,
    @Body(zodBody(SetFileReactionSchema)) body: SetFileReactionInput,
  ) {
    return this.reactions.setReaction(req.clientUser!, attachmentId, body.kind)
  }

  @Delete('attachments/:attachmentId/reaction')
  clearAttachmentReaction(
    @Req() req: ClientPortalRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.reactions.clearReaction(req.clientUser!, attachmentId)
  }

  @Get('attention/unread-count')
  unreadAttentionCount(@Req() req: ClientPortalRequest) {
    return this.projects.unreadAttentionCountForClient(req.clientUser!)
  }

  @Get('attention/items')
  listAttentionItems(@Req() req: ClientPortalRequest) {
    return this.projects.listAttentionForClient(req.clientUser!)
  }

  @Post('attention/mark-read')
  markAttentionRead(
    @Req() req: ClientPortalRequest,
    @Body(zodBody(MarkAttentionReadSchema)) body: MarkAttentionReadInput,
  ) {
    return this.projects.markAttentionReadForClient(req.clientUser!, body)
  }

  @Get('projects/:id')
  getProject(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Query('view') view?: string,
  ) {
    const detailView = view === 'full' ? 'full' : 'overview'
    return this.projects.getForClient(req.clientUser!, id, detailView)
  }

  @Post('projects/:id/change-requests')
  createChangeRequest(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(CreateChangeRequestSchema)) body: CreateChangeRequestInput,
  ) {
    return this.projects.createChangeRequest(req.clientUser!, id, body)
  }

  @Post('projects/:id/phase-approvals')
  createPhaseApproval(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(CreatePhaseApprovalSchema)) body: CreatePhaseApprovalInput,
  ) {
    return this.projects.createPhaseApproval(req.clientUser!, id, body)
  }

  @Post('projects/:id/cancellation-request')
  createCancellationRequest(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(CreateCancellationRequestSchema)) body: CreateCancellationRequestInput,
  ) {
    return this.projects.createCancellationRequest(req.clientUser!, id, body)
  }

  @Post('projects/:id/cover/upload-url')
  coverUploadUrl(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(UploadUrlSchema)) body: UploadUrlInput,
  ) {
    return this.projects.createCoverUploadUrlForClient(req.clientUser!, id, body)
  }

  @Patch('projects/:id/cover')
  registerCover(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(RegisterCoverSchema)) body: RegisterCoverInput,
  ) {
    return this.projects.registerCoverForClient(req.clientUser!, id, body)
  }

  @Delete('projects/:id/cover')
  removeCover(@Req() req: ClientPortalRequest, @Param('id') id: string) {
    return this.projects.removeCoverForClient(req.clientUser!, id)
  }

  @Post('projects/:id/attachments/upload-url')
  uploadUrl(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(UploadUrlSchema)) body: UploadUrlInput,
  ) {
    return this.projects.createUploadUrlForClient(req.clientUser!, id, body)
  }

  @Post('projects/:id/attachments')
  registerAttachment(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body(zodBody(RegisterAttachmentSchema)) body: RegisterAttachmentInput,
  ) {
    return this.projects.registerAttachmentForClient(req.clientUser!, id, body)
  }

  @Get('files/library')
  listFilesLibrary(
    @Req() req: ClientPortalRequest,
    @Query('projectId') projectId?: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projects.listFilesLibraryForClient(req.clientUser!, {
      projectId,
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get('projects/:id/files')
  listProjectFiles(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projects.listFilesForProjectClient(req.clientUser!, id, {
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get('attachments/:attachmentId/download')
  downloadAttachment(
    @Req() req: ClientPortalRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.projects.getAttachmentDownloadUrl(req.clientUser!, attachmentId)
  }

  @Delete('attachments/:attachmentId')
  removeAttachmentFromMessage(
    @Req() req: ClientPortalRequest,
    @Param('attachmentId') attachmentId: string,
    @Query('messageId') messageId?: string,
  ) {
    return this.projects.removeAttachmentFromMessage(
      req.clientUser!,
      attachmentId,
      messageId?.trim() || undefined,
    )
  }

  @Get('project-requests/:requestId')
  getRequestThread(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.projects.getRequestThread(req.clientUser!, requestId)
  }

  @Get('project-requests/:requestId/messages')
  listMessages(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined
    return this.projects.listRequestMessages(req.clientUser!, requestId, {
      cursor: cursor?.trim() || undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    })
  }

  @Post('project-requests/:requestId/messages')
  addMessage(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Body(zodBody(CreateRequestMessageSchema)) body: CreateRequestMessageInput,
  ) {
    return this.projects.addRequestMessage(req.clientUser!, requestId, body)
  }

  @Get('notifications')
  listNotifications(
    @Req() req: ClientPortalRequest,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.projects.listNotificationsForClient(
      req.clientUser!,
      unreadOnly === 'true',
    )
  }

  @Get('notifications/unread-count')
  unreadCount(@Req() req: ClientPortalRequest) {
    return this.projects.unreadNotificationCount(req.clientUser!).then((count) => ({
      count,
    }))
  }

  @Patch('notifications/:id/read')
  markRead(@Req() req: ClientPortalRequest, @Param('id') id: string) {
    return this.projects.markNotificationRead(req.clientUser!, id)
  }
}
