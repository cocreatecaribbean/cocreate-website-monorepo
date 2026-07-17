import { Injectable, Logger } from '@nestjs/common'
import type { Server } from 'socket.io'
import {
  SERVER_INBOX_MESSAGE,
  SERVER_THREAD_ATTACHMENT,
  SERVER_THREAD_MESSAGE,
  SERVER_THREAD_STATUS,
  inboxRoom,
  threadRoom,
} from './messaging.events'

@Injectable()
export class MessagingEmitService {
  private readonly logger = new Logger(MessagingEmitService.name)
  private server: Server | null = null

  attachServer(server: Server): void {
    this.server = server
  }

  get isConfigured(): boolean {
    return Boolean(this.server)
  }

  emitThreadMessage(requestId: string, message: Record<string, unknown>): void {
    if (!this.server) return
    this.server.to(threadRoom(requestId)).emit(SERVER_THREAD_MESSAGE, {
      requestId,
      reason: 'message',
      message,
      at: new Date().toISOString(),
    })
    this.logger.debug(`thread:message ${requestId}`)
  }

  emitThreadAttachment(requestId: string): void {
    if (!this.server) return
    this.server.to(threadRoom(requestId)).emit(SERVER_THREAD_ATTACHMENT, {
      requestId,
      reason: 'attachment',
      at: new Date().toISOString(),
    })
  }

  emitThreadStatus(requestId: string): void {
    if (!this.server) return
    this.server.to(threadRoom(requestId)).emit(SERVER_THREAD_STATUS, {
      requestId,
      reason: 'status',
      at: new Date().toISOString(),
    })
  }

  emitInboxMessage(conversationId: string, message: Record<string, unknown>): void {
    if (!this.server) return
    this.server.to(inboxRoom(conversationId)).emit(SERVER_INBOX_MESSAGE, {
      conversationId,
      message,
      at: new Date().toISOString(),
    })
    this.logger.debug(`inbox:message ${conversationId}`)
  }
}
