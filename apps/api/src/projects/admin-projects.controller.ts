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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import type { AdminRequest } from '../auth/guards/admin-auth.guard'
import { CreateCheckpointDto } from './dto/create-checkpoint.dto'
import { ResolveCancellationDto } from './dto/resolve-cancellation.dto'
import { CreateRequestMessageDto } from './dto/create-request-message.dto'
import { RegisterAttachmentDto } from './dto/register-attachment.dto'
import { RegisterBrandAssetDto } from './dto/register-brand-asset.dto'
import { OrganizationBrandAssetsService } from './organization-brand-assets.service'
import { UpdateProjectDto } from './dto/update-project.dto'
import { MarkInboxReadDto } from './dto/mark-inbox-read.dto'
import { UpdateRequestDto } from './dto/update-request.dto'
import { UploadUrlDto } from './dto/upload-url.dto'
import { CreateProjectForAdminDto } from './dto/create-project-for-admin.dto'
import { ProjectsService } from './projects.service'
import { ProjectAttachmentVisibility } from '@cocreate/database'

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly brandAssets: OrganizationBrandAssetsService,
  ) {}

  private actor(req: AdminRequest) {
    if (!req.adminUser) throw new UnauthorizedException('Session required')
    return req.adminUser
  }

  @Get('projects')
  listAllProjects(@Req() req: AdminRequest) {
    return this.projects.listAllForAdmin(this.actor(req))
  }

  @Get('projects/:id')
  getProject(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.projects.getForAdmin(this.actor(req), id)
  }

  @Patch('projects/:id')
  updateProject(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.updateProject(this.actor(req), id, dto)
  }

  @Post('projects/:id/review-requests')
  createReviewRequest(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: CreateCheckpointDto,
  ) {
    return this.projects.sendProgressCheckpoint(this.actor(req), id, dto)
  }

  @Post('projects/:id/checkpoints')
  sendCheckpoint(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: CreateCheckpointDto,
  ) {
    return this.projects.sendProgressCheckpoint(this.actor(req), id, dto)
  }

  @Post('projects/:id/attachments/upload-url')
  uploadUrl(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.projects.createUploadUrlForAdmin(this.actor(req), id, dto)
  }

  @Post('projects/:id/attachments')
  registerAttachment(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: RegisterAttachmentDto,
  ) {
    return this.projects.registerAttachmentForAdmin(this.actor(req), id, dto)
  }

  @Get('organizations/:organizationId/brand-assets')
  listBrandAssets(@Param('organizationId') organizationId: string) {
    return this.brandAssets.listForOrganization(organizationId)
  }

  @Post('organizations/:organizationId/brand-assets/upload-url')
  brandAssetUploadUrl(
    @Param('organizationId') organizationId: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.brandAssets.createUploadUrl(organizationId, dto)
  }

  @Post('organizations/:organizationId/brand-assets')
  registerBrandAsset(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: RegisterBrandAssetDto,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.brandAssets.register(req.adminUser, organizationId, dto)
  }

  @Get('brand-assets/:assetId/download')
  downloadBrandAsset(@Param('assetId') assetId: string) {
    return this.brandAssets.getDownloadUrl(assetId)
  }

  @Delete('brand-assets/:assetId')
  deleteBrandAsset(@Param('assetId') assetId: string) {
    return this.brandAssets.delete(assetId)
  }

  @Get('organizations/:organizationId/files/library')
  listFilesLibrary(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Query('projectId') projectId?: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.projects.listFilesLibraryForAdmin(this.actor(req), organizationId, {
      projectId,
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
      visibility: visibility as ProjectAttachmentVisibility | undefined,
    })
  }

  @Get('projects/:id/files')
  listProjectFiles(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.projects.listFilesForProjectAdmin(this.actor(req), id, {
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
      visibility: visibility as ProjectAttachmentVisibility | undefined,
    })
  }

  @Get('attachments/:attachmentId/download')
  downloadAttachment(
    @Req() req: AdminRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.projects.getAttachmentDownloadUrl(this.actor(req), attachmentId)
  }

  @Get('project-requests/:requestId')
  getRequestThread(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.projects.getRequestThread(this.actor(req), requestId)
  }

  @Get('project-requests/:requestId/realtime')
  authorizeThreadRealtime(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.projects.authorizeThreadRealtime(this.actor(req), requestId)
  }

  @Post('project-requests/:requestId/messages')
  addMessage(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body() dto: CreateRequestMessageDto,
  ) {
    return this.projects.addRequestMessage(this.actor(req), requestId, dto)
  }

  @Patch('project-requests/:requestId')
  updateRequest(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.projects.updateRequest(this.actor(req), requestId, dto)
  }

  @Post('project-requests/:requestId/resolve-cancellation')
  resolveCancellation(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body() dto: ResolveCancellationDto,
  ) {
    return this.projects.resolveCancellation(this.actor(req), requestId, dto)
  }

  @Get('clients/:organizationId/portal-status')
  getPortalStatus(@Param('organizationId') organizationId: string) {
    return this.projects.resolveOrganizationPortalState(organizationId)
  }

  @Get('clients/:organizationId/projects')
  listOrgProjects(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
  ) {
    return this.projects.listForOrganization(this.actor(req), organizationId)
  }

  @Post('clients/:organizationId/projects')
  createOrgProject(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateProjectForAdminDto,
  ) {
    return this.projects.createForAdmin(this.actor(req), organizationId, dto)
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
    return this.projects.unreadInboxCountForAdmin(this.actor(req), organizationId)
  }

  @Post('clients/:organizationId/inbox/mark-read')
  markInboxRead(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: MarkInboxReadDto,
  ) {
    return this.projects.markInboxReadForAdmin(
      this.actor(req),
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
    return this.projects.approveProject(this.actor(req), organizationId, projectId)
  }
}
