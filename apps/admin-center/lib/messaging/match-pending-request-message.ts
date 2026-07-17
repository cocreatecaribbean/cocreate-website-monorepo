import type { ProjectRequestMessage } from '@/lib/projects/types'

/** Match an optimistic pending message to its socket/HTTP server twin. */
export function matchPendingRequestMessage(
  pending: ProjectRequestMessage,
  incoming: ProjectRequestMessage,
): boolean {
  if (pending.body !== incoming.body) return false
  if (pending.authorRole !== incoming.authorRole) return false
  if (pending.authorUserId && incoming.authorUserId) {
    return pending.authorUserId === incoming.authorUserId
  }
  return true
}
