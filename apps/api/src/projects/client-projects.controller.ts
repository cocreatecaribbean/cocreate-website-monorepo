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
  UseGuards,
} from '@nestjs/common'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { CreateCancellationRequestDto } from './dto/create-cancellation-request.dto'
import { CreateChangeRequestDto } from './dto/create-change-request.dto'
import { CreateRequestMessageDto } from './dto/create-request-message.dto'
import { CreatePhaseApprovalDto } from './dto/create-phase-approval.dto'
import { CreateProjectDto } from './dto/create-project.dto'
import { RegisterAttachmentDto } from './dto/register-attachment.dto'
import { MarkAttentionReadDto } from './dto/mark-attention-read.dto'
import { MarkInboxReadDto } from './dto/mark-inbox-read.dto'
import { UpdateRequestDto } from './dto/update-request.dto'
import { UploadUrlDto } from './dto/upload-url.dto'
import { RegisterCoverDto } from './dto/register-cover.dto'
import { ProjectsService } from './projects.service'

@Controller('client-portal')
@UseGuards(ClientAuthGuard)
export class ClientProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('projects')
  listProjects(@Req() req: ClientPortalRequest) {
    return this.projects.listForClient(req.clientUser!)
  }

  @Post('projects')
  createProject(@Req() req: ClientPortalRequest, @Body() dto: CreateProjectDto) {
    return this.projects.createForClient(req.clientUser!, dto)
  }

  @Get('projects/requests/open')
  listOpenRequests(@Req() req: ClientPortalRequest) {
    return this.projects.listPendingCheckpointsForClient(req.clientUser!)
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
  markApprovalsRead(@Req() req: ClientPortalRequest, @Body() dto: MarkInboxReadDto) {
    return this.projects.markApprovalsReadForClient(req.clientUser!, dto.requestId)
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
  markAttentionRead(@Req() req: ClientPortalRequest, @Body() dto: MarkAttentionReadDto) {
    return this.projects.markAttentionReadForClient(req.clientUser!, dto)
  }

  @Get('projects/:id')
  getProject(@Req() req: ClientPortalRequest, @Param('id') id: string) {
    return this.projects.getForClient(req.clientUser!, id)
  }

  @Post('projects/:id/change-requests')
  createChangeRequest(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: CreateChangeRequestDto,
  ) {
    return this.projects.createChangeRequest(req.clientUser!, id, dto)
  }

  @Post('projects/:id/phase-approvals')
  createPhaseApproval(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: CreatePhaseApprovalDto,
  ) {
    return this.projects.createPhaseApproval(req.clientUser!, id, dto)
  }

  @Post('projects/:id/cancellation-request')
  createCancellationRequest(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: CreateCancellationRequestDto,
  ) {
    return this.projects.createCancellationRequest(req.clientUser!, id, dto)
  }

  @Post('projects/:id/cover/upload-url')
  coverUploadUrl(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.projects.createCoverUploadUrlForClient(req.clientUser!, id, dto)
  }

  @Patch('projects/:id/cover')
  registerCover(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: RegisterCoverDto,
  ) {
    return this.projects.registerCoverForClient(req.clientUser!, id, dto)
  }

  @Delete('projects/:id/cover')
  removeCover(@Req() req: ClientPortalRequest, @Param('id') id: string) {
    return this.projects.removeCoverForClient(req.clientUser!, id)
  }

  @Post('projects/:id/attachments/upload-url')
  uploadUrl(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.projects.createUploadUrlForClient(req.clientUser!, id, dto)
  }

  @Post('projects/:id/attachments')
  registerAttachment(
    @Req() req: ClientPortalRequest,
    @Param('id') id: string,
    @Body() dto: RegisterAttachmentDto,
  ) {
    return this.projects.registerAttachmentForClient(req.clientUser!, id, dto)
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

  @Post('project-requests/:requestId/messages')
  addMessage(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Body() dto: CreateRequestMessageDto,
  ) {
    return this.projects.addRequestMessage(req.clientUser!, requestId, dto)
  }

  @Post('project-requests/:requestId/messages/:messageId/approve')
  approveCheckpoint(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.projects.approveCheckpoint(req.clientUser!, requestId, messageId)
  }

  @Patch('project-requests/:requestId')
  updateRequest(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.projects.updateRequest(req.clientUser!, requestId, dto)
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
