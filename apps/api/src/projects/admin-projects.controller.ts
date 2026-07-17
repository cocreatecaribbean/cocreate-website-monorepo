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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  CreateProjectForAdminSchema,
  type CreateProjectForAdminInput,
  CreateRequestMessageSchema,
  type CreateRequestMessageInput,
  MarkInboxReadSchema,
  type MarkInboxReadInput,
  RegisterAttachmentSchema,
  type RegisterAttachmentInput,
  RegisterBrandAssetSchema,
  type RegisterBrandAssetInput,
  ResolveCancellationSchema,
  type ResolveCancellationInput,
  SetFileReactionSchema,
  type SetFileReactionInput,
  TopPicksQuerySchema,
  UpdateProjectSchema,
  type UpdateProjectInput,
  UploadUrlSchema,
  type UploadUrlInput,
} from '@cocreate/api-contracts/v1/requests/projects'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import type { AdminRequest } from '../auth/guards/admin-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { OrganizationBrandAssetsService } from './organization-brand-assets.service'
import { ProjectsService } from './projects.service'
import { ProjectFileReactionsService } from './project-file-reactions.service'
import { ProjectAttachmentVisibility } from '@cocreate/database'

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly brandAssets: OrganizationBrandAssetsService,
    private readonly reactions: ProjectFileReactionsService,
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
  getProject(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Query('view') view?: string,
  ) {
    const detailView = view === 'full' ? 'full' : 'overview'
    return this.projects.getForAdmin(this.actor(req), id, detailView)
  }

  @Patch('projects/:id')
  updateProject(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body(zodBody(UpdateProjectSchema)) body: UpdateProjectInput,
  ) {
    return this.projects.updateProject(this.actor(req), id, body)
  }

  @Get('projects/:id/top-picks')
  listProjectTopPicks(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Query() query: Record<string, string | string[] | undefined>,
  ) {
    const parsed = TopPicksQuerySchema.safeParse(query)
    const tags = parsed.success ? parsed.data.tags : []
    return this.reactions.listTopPicksForProject(this.actor(req), id, tags)
  }

  @Get('projects/:id/file-reactions')
  listProjectFileReactions(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.reactions.listReactionsForProject(this.actor(req), id)
  }

  @Put('attachments/:attachmentId/reaction')
  setAttachmentReaction(
    @Req() req: AdminRequest,
    @Param('attachmentId') attachmentId: string,
    @Body(zodBody(SetFileReactionSchema)) body: SetFileReactionInput,
  ) {
    return this.reactions.setReaction(this.actor(req), attachmentId, body.kind)
  }

  @Delete('attachments/:attachmentId/reaction')
  clearAttachmentReaction(
    @Req() req: AdminRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.reactions.clearReaction(this.actor(req), attachmentId)
  }

  @Post('projects/:id/attachments/upload-url')
  uploadUrl(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body(zodBody(UploadUrlSchema)) body: UploadUrlInput,
  ) {
    return this.projects.createUploadUrlForAdmin(this.actor(req), id, body)
  }

  @Post('projects/:id/attachments')
  registerAttachment(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body(zodBody(RegisterAttachmentSchema)) body: RegisterAttachmentInput,
  ) {
    return this.projects.registerAttachmentForAdmin(this.actor(req), id, body)
  }

  @Get('organizations/:organizationId/brand-assets')
  listBrandAssets(@Param('organizationId') organizationId: string) {
    return this.brandAssets.listForOrganization(organizationId)
  }

  @Post('organizations/:organizationId/brand-assets/upload-url')
  brandAssetUploadUrl(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(UploadUrlSchema)) body: UploadUrlInput,
  ) {
    return this.brandAssets.createUploadUrl(organizationId, body)
  }

  @Post('organizations/:organizationId/brand-assets')
  registerBrandAsset(
    @Req() req: AdminRequest,
    @Param('organizationId') organizationId: string,
    @Body(zodBody(RegisterBrandAssetSchema)) body: RegisterBrandAssetInput,
  ) {
    if (!req.adminUser) throw new UnauthorizedException('Admin session required')
    return this.brandAssets.register(req.adminUser, organizationId, body)
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

  @Delete('attachments/:attachmentId')
  removeAttachmentFromMessage(
    @Req() req: AdminRequest,
    @Param('attachmentId') attachmentId: string,
    @Query('messageId') messageId?: string,
  ) {
    return this.projects.removeAttachmentFromMessage(
      this.actor(req),
      attachmentId,
      messageId?.trim() || undefined,
    )
  }

  @Get('project-requests/:requestId')
  getRequestThread(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.projects.getRequestThread(this.actor(req), requestId)
  }

  @Get('project-requests/:requestId/messages')
  listMessages(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined
    return this.projects.listRequestMessages(this.actor(req), requestId, {
      cursor: cursor?.trim() || undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    })
  }

  @Post('project-requests/:requestId/messages')
  addMessage(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body(zodBody(CreateRequestMessageSchema)) body: CreateRequestMessageInput,
  ) {
    return this.projects.addRequestMessage(this.actor(req), requestId, body)
  }

  @Post('project-requests/:requestId/resolve-cancellation')
  resolveCancellation(
    @Req() req: AdminRequest,
    @Param('requestId') requestId: string,
    @Body(zodBody(ResolveCancellationSchema)) body: ResolveCancellationInput,
  ) {
    return this.projects.resolveCancellation(this.actor(req), requestId, body)
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
    @Body(zodBody(CreateProjectForAdminSchema)) body: CreateProjectForAdminInput,
  ) {
    return this.projects.createForAdmin(this.actor(req), organizationId, body)
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
    @Body(zodBody(MarkInboxReadSchema)) body: MarkInboxReadInput,
  ) {
    return this.projects.markInboxReadForAdmin(
      this.actor(req),
      organizationId,
      body.requestId,
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
