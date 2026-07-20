'use client'

import Link from 'next/link'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { ClientRecentActivityItem } from '@/lib/dashboard/types'
import { bricolage_grot600 } from '@/styles/fonts'

type ClientPortalRecentUpdatesProps = {
  items: ClientRecentActivityItem[]
  compact?: boolean
}

function formatActivityDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function ClientPortalRecentUpdates({
  items,
  compact = false,
}: ClientPortalRecentUpdatesProps) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-app-muted">No recent activity yet.</p>
  }

  const list = (
    <ul className="divide-y divide-chambray/6">
      {items.map((item) => {
        const actor =
          item.actorLabel?.trim() ||
          item.actorName?.trim() ||
          item.actorEmail?.trim() ||
          null
        const content = (
          <>
            <p className={`text-app-primary ${bricolage_grot600.className}`}>
              {item.summary ?? item.action}
            </p>
            <p className="mt-1 text-sm text-sanmarino">{item.projectTitle}</p>
            <p className="mt-2 text-xs font-medium tracking-wide text-app-muted">
              {actor ? <span className="text-sanmarino">{actor}</span> : null}
              {actor ? ' · ' : ''}
              {formatActivityDateTime(item.createdAt)}
              <span> · {formatRelativeTime(item.createdAt)}</span>
            </p>
          </>
        )

        return (
          <li
            key={item.id}
            className="border-b border-chambray/6 py-4 first:pt-0 last:border-0 last:pb-0"
          >
            {item.href ? (
              <Link href={item.href} className="block rounded-lg transition hover:opacity-90">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ul>
  )

  if (compact) {
    return (
      <div className="mt-5 min-h-0 max-h-80 overflow-y-auto overscroll-y-contain pr-0.5">
        {list}
      </div>
    )
  }

  return list
}
