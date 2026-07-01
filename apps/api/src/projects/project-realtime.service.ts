import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'

export const THREAD_REALTIME_EVENT = 'thread:update'
export const ORG_INBOX_REALTIME_EVENT = 'inbox:update'

export type OrgInboxRealtimeMessage = {
  id: string
  conversationId: string
  authorUserId: string
  authorEmail: string
  authorRole: 'CLIENT' | 'ADMIN'
  body: string
  createdAt: string
}

export type ThreadRealtimeMessage = Record<string, unknown>

export type ThreadRealtimePayload = {
  requestId: string
  reason: 'message' | 'checkpoint' | 'status' | 'attachment'
  messageId?: string
  message?: ThreadRealtimeMessage
  at: string
}

export type OrgInboxRealtimePayload = {
  conversationId: string
  messageId?: string
  message?: OrgInboxRealtimeMessage
  at: string
}

@Injectable()
export class ProjectRealtimeService {
  private readonly logger = new Logger(ProjectRealtimeService.name)
  private readonly client: SupabaseClient | null
  private readonly threadChannels = new Map<string, RealtimeChannel>()
  private readonly orgInboxChannels = new Map<string, RealtimeChannel>()

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

  private async getSubscribedChannel(
    id: string,
    kind: 'thread' | 'inbox',
  ): Promise<RealtimeChannel | null> {
    if (!this.client) return null

    const channels = kind === 'thread' ? this.threadChannels : this.orgInboxChannels
    const existing = channels.get(id)
    if (existing) return existing

    const channelName =
      kind === 'thread' ? this.channelName(id) : this.orgInboxChannelName(id)
    const channel = this.client.channel(channelName)

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Realtime subscribe timed out'))
        }, 10_000)

        channel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            channels.delete(id)
            reject(err ?? new Error(`Realtime channel ${status}`))
          }
        })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Realtime subscribe failed for ${channelName}: ${message}`)
      void this.client.removeChannel(channel)
      return null
    }

    channels.set(id, channel)
    return channel
  }

  async publishOrgInboxUpdate(
    conversationId: string,
    payload: { message: OrgInboxRealtimeMessage },
  ): Promise<void> {
    const channel = await this.getSubscribedChannel(conversationId, 'inbox')
    if (!channel) return

    try {
      await channel.send({
        type: 'broadcast',
        event: ORG_INBOX_REALTIME_EVENT,
        payload: {
          conversationId,
          messageId: payload.message.id,
          message: payload.message,
          at: new Date().toISOString(),
        } satisfies OrgInboxRealtimePayload,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `Realtime publish failed for org inbox ${conversationId}: ${message}`,
      )
      this.orgInboxChannels.delete(conversationId)
    }
  }

  async publishThreadUpdate(
    requestId: string,
    payload: Omit<ThreadRealtimePayload, 'requestId' | 'at'>,
  ): Promise<void> {
    const channel = await this.getSubscribedChannel(requestId, 'thread')
    if (!channel) return

    try {
      await channel.send({
        type: 'broadcast',
        event: THREAD_REALTIME_EVENT,
        payload: {
          requestId,
          ...payload,
          at: new Date().toISOString(),
        } satisfies ThreadRealtimePayload,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Realtime publish failed for request ${requestId}: ${message}`)
      this.threadChannels.delete(requestId)
    }
  }
}
