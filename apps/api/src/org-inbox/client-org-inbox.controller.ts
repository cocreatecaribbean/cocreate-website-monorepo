import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  CreateOrgInboxConversationSchema,
  RegisterOrgInboxAttachmentSchema,
  SendOrgInboxMessageSchema,
  type CreateOrgInboxConversationInput,
  type RegisterOrgInboxAttachmentInput,
  type SendOrgInboxMessageInput,
} from '@cocreate/api-contracts/v1/requests/org-inbox'
import { UploadUrlSchema, type UploadUrlInput } from '@cocreate/api-contracts/v1/requests/projects'
import { ClientAuthGuard, type ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { OrgInboxService } from './org-inbox.service'

@Controller({ path: 'client-portal/inbox', version: '1' })
@UseGuards(ClientAuthGuard)
export class ClientOrgInboxController {
  constructor(private readonly inbox: OrgInboxService) {}

  @Get('conversations')
  listConversations(@Req() req: ClientPortalRequest) {
    return this.inbox.listConversationsForClient(req.clientUser!)
  }

  @Get('unread-count')
  unreadCount(@Req() req: ClientPortalRequest) {
    return this.inbox.unreadCountForClient(req.clientUser!)
  }

  @Post('conversations')
  createConversation(
    @Req() req: ClientPortalRequest,
    @Body(zodBody(CreateOrgInboxConversationSchema)) body: CreateOrgInboxConversationInput,
  ) {
    return this.inbox.createConversationForClient(req.clientUser!, body)
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.inbox.listMessages(conversationId, req.clientUser!)
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
    @Body(zodBody(SendOrgInboxMessageSchema)) body: SendOrgInboxMessageInput,
  ) {
    return this.inbox.sendMessageAsClient(req.clientUser!, conversationId, body)
  }

  @Post('conversations/:conversationId/attachments/upload-url')
  createUploadUrl(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
    @Body(zodBody(UploadUrlSchema)) body: UploadUrlInput,
  ) {
    return this.inbox.createUploadUrl(req.clientUser!, conversationId, body)
  }

  @Post('conversations/:conversationId/attachments')
  registerAttachment(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
    @Body(zodBody(RegisterOrgInboxAttachmentSchema)) body: RegisterOrgInboxAttachmentInput,
  ) {
    return this.inbox.registerAttachment(req.clientUser!, conversationId, body)
  }

  @Get('attachments/:attachmentId/download')
  downloadAttachment(
    @Req() req: ClientPortalRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.inbox.getAttachmentDownloadUrl(req.clientUser!, attachmentId)
  }

  @Post('conversations/:conversationId/mark-read')
  markRead(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.inbox.markRead(req.clientUser!.id, conversationId)
  }

  @Get('conversations/:conversationId/realtime')
  authorizeRealtime(
    @Req() req: ClientPortalRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.inbox.authorizeRealtime(req.clientUser!, conversationId)
  }
}
