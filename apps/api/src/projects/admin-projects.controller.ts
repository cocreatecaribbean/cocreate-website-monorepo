import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import type { AdminRequest } from '../auth/guards/admin-auth.guard'
import { CreateCheckpointDto } from './dto/create-checkpoint.dto'
import { ResolveCancellationDto } from './dto/resolve-cancellation.dto'
import { CreateRequestMessageDto } from './dto/create-request-message.dto'
import { RegisterAttachmentDto } from './dto/register-attachment.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { MarkInboxReadDto } from './dto/mark-inbox-read.dto'
import { UpdateRequestDto } from './dto/update-request.dto'
import { UploadUrlDto } from './dto/upload-url.dto'
import { ProjectsService } from './projects.service'

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('projects')
  listAllProjects() {
    return this.projects.listAllForAdmin()
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.projects.getForAdmin(id)
  }

  @Patch('projects/:id')
  updateProject(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.updateProject(req.adminUser, id, dto)
  }

  @Post('projects/:id/review-requests')
  createReviewRequest(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: CreateCheckpointDto,
  ) {
    if (!req.adminUser) {
      throw new Error('Admin user required for review requests')
    }
    return this.projects.sendProgressCheckpoint(req.adminUser, id, dto)
  }

  @Post('projects/:id/checkpoints')
  sendCheckpoint(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: CreateCheckpointDto,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.sendProgressCheckpoint(req.adminUser, id, dto)
  }

  @Post('projects/:id/attachments/upload-url')
  uploadUrl(@Param('id') id: string, @Body() dto: UploadUrlDto) {
    return this.projects.createUploadUrlForAdmin(id, dto)
  }

  @Post('projects/:id/attachments')
  registerAttachment(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: RegisterAttachmentDto,
  ) {
    if (!req.adminUser) {
      throw new Error('Admin user required')
    }
    return this.projects.registerAttachmentForAdmin(req.adminUser, id, dto)
  }

  @Get('organizations/:organizationId/files/library')
  listFilesLibrary(
    @Param('organizationId') organizationId: string,
    @Query('projectId') projectId?: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projects.listFilesLibraryForAdmin(organizationId, {
      projectId,
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get('projects/:id/files')
  listProjectFiles(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projects.listFilesForProjectAdmin(id, {
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get('attachments/:attachmentId/download')
  downloadAttachment(
    @Req() req: AdminRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    if (!req.adminUser) {
      throw new Error('Admin user required')
    }
    return this.projects.getAttachmentDownloadUrl(req.adminUser, attachmentId)
  }

  @Get('project-requests/:requestId')
  getRequestThread(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.getRequestThread(req.adminUser, requestId)
  }

  @Get('project-requests/:requestId/realtime')
  authorizeThreadRealtime(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.authorizeThreadRealtime(req.adminUser, requestId)
  }

  @Post('project-requests/:requestId/messages')
  addMessage(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body() dto: CreateRequestMessageDto,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.addRequestMessage(req.adminUser, requestId, dto)
  }

  @Patch('project-requests/:requestId')
  updateRequest(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateRequestDto,
  ) {
    if (!req.adminUser) {
      throw new Error('Admin user required')
    }
    return this.projects.updateRequest(req.adminUser, requestId, dto)
  }

  @Post('project-requests/:requestId/resolve-cancellation')
  resolveCancellation(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body() dto: ResolveCancellationDto,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.resolveCancellation(req.adminUser, requestId, dto)
  }

  @Get('clients/:organizationId/projects')
  listOrgProjects(@Param('organizationId') organizationId: string) {
    return this.projects.listForOrganization(organizationId)
  }

  @Get('clients/:organizationId/inbox')
  listOrgInbox(@Param('organizationId') organizationId: string) {
    return this.projects.listInboxForOrganization(organizationId)
  }

  @Get('clients/:organizationId/inbox/unread-count')
  inboxUnreadCount(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.unreadInboxCountForAdmin(req.adminUser, organizationId)
  }

  @Post('clients/:organizationId/inbox/mark-read')
  markInboxRead(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: MarkInboxReadDto,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.projects.markInboxReadForAdmin(
      req.adminUser,
      organizationId,
      dto.requestId,
    )
  }

  @Get('clients/:organizationId/activity')
  listOrgActivity(@Param('organizationId') organizationId: string) {
    return this.projects.listActivityForOrganization(organizationId)
  }

  @Post('clients/:organizationId/projects/:projectId/approve')
  approveProject(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
  ) {
    if (!req.adminUser) {
      throw new Error('Admin user required to approve projects')
    }
    return this.projects.approveProject(req.adminUser, organizationId, projectId)
  }
}
