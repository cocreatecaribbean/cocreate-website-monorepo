import type { ProjectRequestMessage } from '@/lib/projects/api-types'

export const THREAD_REALTIME_EVENT = 'thread:update'

export type ThreadRealtimePayload = {
  requestId: string
  reason: 'message' | 'checkpoint' | 'status' | 'attachment'
  messageId?: string
  message?: ProjectRequestMessage
  at: string
}

export function isThreadRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REALTIME_THREADS !== 'false'
}
