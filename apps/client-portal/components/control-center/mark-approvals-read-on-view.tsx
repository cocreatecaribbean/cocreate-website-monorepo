'use client'

import { useEffect, useRef } from 'react'
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
  const { mutate } = useMarkApprovalsReadMutation()
  const markedRequestIds = useRef(new Set<string>())

  useEffect(() => {
    if (!enabled || !requestId) return
    if (markedRequestIds.current.has(requestId)) return
    markedRequestIds.current.add(requestId)
    mutate(requestId)
  }, [requestId, enabled, mutate])

  return null
}
