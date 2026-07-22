import { Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import type { AuthenticatedAdmin, AuthenticatedClient } from '../auth/auth.service'
import { OrgInboxService } from '../org-inbox/org-inbox.service'
import { ProjectsService } from '../projects/projects.service'
import { MessagingEmitService } from './messaging-emit.service'
import { MessagingPresenceService } from './messaging-presence.service'
import {
  CLIENT_JOIN_INBOX,
  CLIENT_JOIN_THREAD,
  CLIENT_LEAVE_INBOX,
  CLIENT_LEAVE_THREAD,
  inboxRoom,
  threadRoom,
} from './messaging.events'

type MessagingSocket = Socket & {
  data: {
    actor?: AuthenticatedAdmin | AuthenticatedClient
  }
}

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3003',
    ],
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagingGateway.name)

  @WebSocketServer()
  server!: Server

  constructor(
    private readonly auth: AuthService,
    private readonly projects: ProjectsService,
    private readonly inbox: OrgInboxService,
    private readonly emitService: MessagingEmitService,
    private readonly presence: MessagingPresenceService,
  ) {}

  afterInit(server: Server): void {
    this.emitService.attachServer(server)
    this.logger.log('Messaging gateway ready')
  }

  async handleConnection(client: MessagingSocket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined
      if (!token) {
        throw new Error('Missing auth token')
      }

      try {
        client.data.actor = await this.auth.requireAgencyUser(token)
      } catch {
        client.data.actor = await this.auth.requireClient(token)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Messaging connection rejected: ${message}`)
      client.disconnect(true)
    }
  }

  handleDisconnect(client: MessagingSocket): void {
    const userId = client.data.actor?.id
    if (userId) {
      this.presence.leaveAllRooms(userId)
    }
  }

  @SubscribeMessage(CLIENT_JOIN_THREAD)
  async joinThread(
    @ConnectedSocket() client: MessagingSocket,
    @MessageBody() body: { requestId?: string },
  ): Promise<{ ok: boolean }> {
    const requestId = body?.requestId?.trim()
    const actor = client.data.actor
    if (!requestId || !actor) return { ok: false }

    await this.projects.assertThreadAccess(actor, requestId)
    await client.join(threadRoom(requestId))
    this.presence.joinRoom(threadRoom(requestId), actor.id)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`socket ${client.id} joined ${threadRoom(requestId)}`)
    }
    return { ok: true }
  }

  @SubscribeMessage(CLIENT_LEAVE_THREAD)
  async leaveThread(
    @ConnectedSocket() client: MessagingSocket,
    @MessageBody() body: { requestId?: string },
  ): Promise<{ ok: boolean }> {
    const requestId = body?.requestId?.trim()
    const actor = client.data.actor
    if (!requestId) return { ok: false }
    await client.leave(threadRoom(requestId))
    if (actor) {
      this.presence.leaveRoom(threadRoom(requestId), actor.id)
    }
    return { ok: true }
  }

  @SubscribeMessage(CLIENT_JOIN_INBOX)
  async joinInbox(
    @ConnectedSocket() client: MessagingSocket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<{ ok: boolean }> {
    const conversationId = body?.conversationId?.trim()
    const actor = client.data.actor
    if (!conversationId || !actor) return { ok: false }

    await this.inbox.assertInboxAccess(actor, conversationId)
    await client.join(inboxRoom(conversationId))
    this.presence.joinRoom(inboxRoom(conversationId), actor.id)
    return { ok: true }
  }

  @SubscribeMessage(CLIENT_LEAVE_INBOX)
  async leaveInbox(
    @ConnectedSocket() client: MessagingSocket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<{ ok: boolean }> {
    const conversationId = body?.conversationId?.trim()
    const actor = client.data.actor
    if (!conversationId) return { ok: false }
    await client.leave(inboxRoom(conversationId))
    if (actor) {
      this.presence.leaveRoom(inboxRoom(conversationId), actor.id)
    }
    return { ok: true }
  }
}
