import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const THREAD_REALTIME_EVENT = 'thread:update'
export const ORG_INBOX_REALTIME_EVENT = 'inbox:update'

export type ThreadRealtimePayload = {
  requestId: string
  reason: 'message' | 'checkpoint' | 'status' | 'attachment'
  messageId?: string
  at: string
}

@Injectable()
export class ProjectRealtimeService {
  private readonly logger = new Logger(ProjectRealtimeService.name)
  private readonly client: SupabaseClient | null

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL')
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    this.client =
      url && serviceKey
        ? createClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null
  }

  get isConfigured(): boolean {
    return Boolean(this.client)
  }

  channelName(requestId: string): string {
    return `request:${requestId}`
  }

  orgInboxChannelName(conversationId: string): string {
    return `org-inbox:${conversationId}`
  }

  async publishOrgInboxUpdate(
    conversationId: string,
    payload: { messageId: string },
  ): Promise<void> {
    if (!this.client) return

    const channel = this.client.channel(this.orgInboxChannelName(conversationId))

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          void this.client?.removeChannel(channel)
          reject(new Error('Realtime publish timed out'))
        }, 10_000)

        channel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            void channel
              .send({
                type: 'broadcast',
                event: ORG_INBOX_REALTIME_EVENT,
                payload: {
                  conversationId,
                  messageId: payload.messageId,
                  at: new Date().toISOString(),
                },
              })
              .then(() => {
                clearTimeout(timeout)
                void this.client?.removeChannel(channel)
                resolve()
              })
              .catch((sendError: unknown) => {
                clearTimeout(timeout)
                void this.client?.removeChannel(channel)
                reject(sendError)
              })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            void this.client?.removeChannel(channel)
            reject(err ?? new Error(`Realtime channel ${status}`))
          }
        })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `Realtime publish failed for org inbox ${conversationId}: ${message}`,
      )
    }
  }

  async publishThreadUpdate(
    requestId: string,
    payload: Omit<ThreadRealtimePayload, 'requestId' | 'at'>,
  ): Promise<void> {
    if (!this.client) return

    const channel = this.client.channel(this.channelName(requestId))

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          void this.client?.removeChannel(channel)
          reject(new Error('Realtime publish timed out'))
        }, 10_000)

        channel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            void channel
              .send({
                type: 'broadcast',
                event: THREAD_REALTIME_EVENT,
                payload: {
                  requestId,
                  ...payload,
                  at: new Date().toISOString(),
                } satisfies ThreadRealtimePayload,
              })
              .then(() => {
                clearTimeout(timeout)
                void this.client?.removeChannel(channel)
                resolve()
              })
              .catch((sendError: unknown) => {
                clearTimeout(timeout)
                void this.client?.removeChannel(channel)
                reject(sendError)
              })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            void this.client?.removeChannel(channel)
            reject(err ?? new Error(`Realtime channel ${status}`))
          }
        })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Realtime publish failed for request ${requestId}: ${message}`)
    }
  }
}
