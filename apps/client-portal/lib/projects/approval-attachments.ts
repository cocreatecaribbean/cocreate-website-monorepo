import type { ProjectRequestItem } from '@/lib/projects/api-types'
import type { ThreadAttachment } from '@/lib/projects/thread-content'
import { indexAttachmentsByMessage } from '@/lib/projects/thread-content'

export function findPendingCheckpointMessage(item: ProjectRequestItem) {
  return item.messages?.find((msg) => msg.isPendingApproval)
}

export function attachmentsForPendingCheckpoint(
  item: ProjectRequestItem,
): ThreadAttachment[] {
  const pending = findPendingCheckpointMessage(item)
  if (pending?.attachments?.length) {
    return pending.attachments
  }

  const messages = item.messages ?? []
  if (messages.length === 0) return []

  const map = indexAttachmentsByMessage(messages, item.attachments)
  const pendingIndex = messages.findIndex((msg) => msg.isPendingApproval)
  if (pendingIndex >= 0) {
    return map.get(pendingIndex) ?? []
  }

  return []
}
