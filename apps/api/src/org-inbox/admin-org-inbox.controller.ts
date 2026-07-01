import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  SendOrgInboxMessageSchema,
  type SendOrgInboxMessageInput,
} from '@cocreate/api-contracts/v1/requests/org-inbox'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { OrgInboxService } from './org-inbox.service'

@Controller({ path: 'admin/inbox', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminOrgInboxController {
  constructor(private readonly inbox: OrgInboxService) {}

  @Get('conversations')
  listAll(@Req() req: AdminRequest) {
    return this.inbox.listAllConversationsForAdmin(req.adminUser!)
  }

  @Get('unread-count')
  unreadCount(@Req() req: AdminRequest) {
    return this.inbox.unreadCountForAdmin(req.adminUser!.id)
  }

  @Get('clients/:organizationId/conversations')
  listForOrg(@Req() req: AdminRequest, @Param('organizationId') organizationId: string) {
    return this.inbox.listConversationsForAdmin(organizationId, req.adminUser!)
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @Req() req: AdminRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.inbox.listMessages(conversationId, req.adminUser!)
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Req() req: AdminRequest,
    @Param('conversationId') conversationId: string,
    @Body(zodBody(SendOrgInboxMessageSchema)) body: SendOrgInboxMessageInput,
  ) {
    return this.inbox.sendMessageAsAdmin(req.adminUser!, conversationId, body)
  }

  @Post('conversations/:conversationId/mark-read')
  markRead(
    @Req() req: AdminRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.inbox.markRead(req.adminUser!.id, conversationId)
  }

  @Get('conversations/:conversationId/realtime')
  authorizeRealtime(
    @Req() req: AdminRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.inbox.authorizeRealtime(req.adminUser!, conversationId)
  }
}
