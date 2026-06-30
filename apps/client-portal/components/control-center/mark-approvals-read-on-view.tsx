'use client'

import { useEffect } from 'react'
import { useMarkApprovalsReadMutation } from '@/lib/api/mutations/approvals'

type MarkApprovalsReadOnViewProps = {
  requestId: string
  enabled: boolean
}

/** Marks checkpoint approval notifications read when a client views a request thread. */
export default function MarkApprovalsReadOnView({
  requestId,
  enabled,
}: MarkApprovalsReadOnViewProps) {
  const markRead = useMarkApprovalsReadMutation()

  useEffect(() => {
    if (!enabled || !requestId) return
    markRead.mutate(requestId)
  }, [requestId, enabled, markRead])

  return null
}
