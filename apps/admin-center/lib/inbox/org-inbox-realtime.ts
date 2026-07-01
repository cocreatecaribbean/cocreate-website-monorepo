export const ORG_INBOX_REALTIME_EVENT = 'inbox:update'

export function isOrgInboxRealtimeEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
