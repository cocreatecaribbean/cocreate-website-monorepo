'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ATTENTION_PAGE_PATH, formatAttentionStatusLabel } from '@/lib/control-center/attention-items'
import { queryKeys } from '@/lib/api/query-keys'
import { useUnreadAttentionCountQuery } from '@/lib/api/queries/notifications'
import { fetchAttentionItems } from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600 } from '@/styles/fonts'

export default function ControlCenterAttentionLink({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: count = 0, refetch } = useUnreadAttentionCountQuery()

  useEffect(() => {
    const handler = () => void refetch()
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }, [refetch])

  if (count <= 0) return null

  return (
    <Link
      href={ATTENTION_PAGE_PATH}
      onClick={() => onNavigate?.()}
      onMouseEnter={() => {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.attention.items(),
          queryFn: fetchAttentionItems,
        })
      }}
      className={`mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-casablanca/90 transition hover:text-casablanca hover:underline ${bricolage_grot600.className}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-casablanca" aria-hidden />
      {formatAttentionStatusLabel(count)}
    </Link>
  )
}
