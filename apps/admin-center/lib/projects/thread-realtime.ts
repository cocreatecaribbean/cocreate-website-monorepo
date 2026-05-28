export const THREAD_REALTIME_EVENT = 'thread:update'

export function isThreadRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REALTIME_THREADS !== 'false'
}
