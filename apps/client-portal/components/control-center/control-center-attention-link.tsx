'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ATTENTION_PAGE_PATH, formatAttentionStatusLabel } from '@/lib/control-center/attention-items'
import { fetchUnreadNotificationCount } from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600 } from '@/styles/fonts'

export default function ControlCenterAttentionLink() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    void fetchUnreadNotificationCount().then(setCount)
  }, [])

  if (count <= 0) return null

  return (
    <Link
      href={ATTENTION_PAGE_PATH}
      className={`mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-casablanca/90 transition hover:text-casablanca hover:underline ${bricolage_grot600.className}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-casablanca" aria-hidden />
      {formatAttentionStatusLabel(count)}
    </Link>
  )
}
