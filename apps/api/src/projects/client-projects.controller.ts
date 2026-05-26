import {
  Body,
  Controller,
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
import { CreateChangeRequestDto } from './dto/create-change-request.dto'
import { CreateRequestMessageDto } from './dto/create-request-message.dto'
import { CreatePhaseApprovalDto } from './dto/create-phase-approval.dto'
import { CreateProjectDto } from './dto/create-project.dto'
import { RegisterAttachmentDto } from './dto/register-attachment.dto'
import { UpdateRequestDto } from './dto/update-request.dto'
import { UploadUrlDto } from './dto/upload-url.dto'
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
    return this.projects.listOpenRequestsForClient(req.clientUser!)
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

  @Post('project-requests/:requestId/messages')
  addMessage(
    @Req() req: ClientPortalRequest,
    @Param('requestId') requestId: string,
    @Body() dto: CreateRequestMessageDto,
  ) {
    return this.projects.addRequestMessage(req.clientUser!, requestId, dto)
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
