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
  UpdateRequestSchema,
  type UpdateRequestInput,
  UploadUrlSchema,
  type UploadUrlInput,
  RequestApprovalNeedsChangesSchema,
  type RequestApprovalNeedsChangesInput,
  AddApprovalCommentSchema,
  type AddApprovalCommentInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { ProjectsService } from './projects.service'
import { ProjectApprovalsService } from './project-approvals.service'

@Controller({ path: 'client-portal', version: '1' })
@UseGuards(ClientAuthGuard)
export class ClientProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly approvals: ProjectApprovalsService,
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

  @Get('projects/requests/open')
  listOpenRequests(@Req() req: ClientPortalRequest) {
    return this.projects.listPendingApprovalFilesForClient(req.clientUser!)
  }

  @Get('approvals/open')
  listOpenApprovals(@Req() req: ClientPortalRequest) {
    return this.approvals.listOpenForClient(req.clientUser!)
  }

  @Post('approvals/:itemId/approve')
  approveFile(@Req() req: ClientPortalRequest, @Param('itemId') itemId: string) {
    return this.approvals.approveItem(req.clientUser!, itemId)
  }

  @Post('approvals/:itemId/needs-changes')
  requestNeedsChanges(
    @Req() req: ClientPortalRequest,
    @Param('itemId') itemId: string,
    @Body(zodBody(RequestApprovalNeedsChangesSchema)) body: RequestApprovalNeedsChangesInput,
  ) {
    return this.approvals.requestNeedsChanges(req.clientUser!, itemId, body)
  }

  @Get('approvals/:itemId/comments')
  listApprovalComments(@Req() req: ClientPortalRequest, @Param('itemId') itemId: string) {
    return this.approvals.listComments(req.clientUser!, itemId)
  }

  @Post('approvals/:itemId/comments')
  addApprovalComment(
    @Req() req: ClientPortalRequest,
    @Param('itemId') itemId: string,
    @Body(zodBody(AddApprovalCommentSchema)) body: AddApprovalCommentInput,
  ) {
    return this.approvals.addComment(req.clientUser!, itemId, body)
  }

  @Get('approvals/history')
  listApprovalHistory(@Req() req: ClientPortalRequest) {
    return this.projects.listApprovalHistoryForClient(req.clientUser!)
  }

  @Get('approvals/unread-count')
  unreadApprovalsCount(@Req() req: ClientPortalRequest) {
    return this.projects.unreadApprovalsCountForClient(req.clientUser!)
  }

  @Post('approvals/mark-read')
  markApprovalsRead(
    @Req() req: ClientPortalRequest,
    @Body(zodBody(MarkInboxReadSchema)) body: MarkInboxReadInput,
  ) {
    return this.projects.markApprovalsReadForClient(req.clientUser!, body.requestId)
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

  @Get('project-requests/:requestId/realtime')
  authorizeThreadRealtime(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.projects.authorizeThreadRealtime(req.clientUser!, requestId)
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

  @Post('project-requests/:requestId/messages/:messageId/approve')
  approveCheckpoint(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.projects.approveCheckpoint(req.clientUser!, requestId, messageId)
  }

  @Post('project-requests/:requestId/messages/:messageId/files/:attachmentId/approve')
  approveCheckpointFile(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.projects.approveCheckpointFile(
      req.clientUser!,
      requestId,
      messageId,
      attachmentId,
    )
  }

  @Patch('project-requests/:requestId')
  updateRequest(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Body(zodBody(UpdateRequestSchema)) body: UpdateRequestInput,
  ) {
    return this.projects.updateRequest(req.clientUser!, requestId, body)
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
