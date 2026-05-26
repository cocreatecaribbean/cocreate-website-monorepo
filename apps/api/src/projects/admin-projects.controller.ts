import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import type { AdminRequest } from '../auth/guards/admin-auth.guard'
import { CreateReviewRequestDto } from './dto/create-review-request.dto'
import { CreateRequestMessageDto } from './dto/create-request-message.dto'
import { RegisterAttachmentDto } from './dto/register-attachment.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
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
    @Body() dto: CreateReviewRequestDto,
  ) {
    if (!req.adminUser) {
      throw new Error('Admin user required for review requests')
    }
    return this.projects.createReviewRequest(req.adminUser, id, dto)
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

  @Get('clients/:organizationId/projects')
  listOrgProjects(@Param('organizationId') organizationId: string) {
    return this.projects.listForOrganization(organizationId)
  }

  @Get('clients/:organizationId/inbox')
  listOrgInbox(@Param('organizationId') organizationId: string) {
    return this.projects.listInboxForOrganization(organizationId)
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
