'use client'

import { useCallback } from 'react'
import { markInboxRead } from '@/lib/projects/inbox-unread'
import { useMarkReadWhileViewing } from '@/lib/messaging/use-mark-read-while-viewing'

type MarkInboxReadOnViewProps = {
  organizationId: string
  requestId: string
  enabled: boolean
  /** Re-mark when new messages arrive while the thread is open. */
  latestMessageId?: string | null
  onMarked?: () => void
}

/** Marks portal notifications read when an admin views a request thread. */
export default function MarkInboxReadOnView({
  organizationId,
  requestId,
  enabled,
  latestMessageId = null,
  onMarked,
}: MarkInboxReadOnViewProps) {
  const mark = useCallback(async () => {
    await markInboxRead(organizationId, requestId)
    onMarked?.()
  }, [organizationId, requestId, onMarked])

  useMarkReadWhileViewing({
    enabled: enabled && Boolean(requestId),
    viewId: requestId,
    latestMessageId,
    mark,
  })

  return null
}
