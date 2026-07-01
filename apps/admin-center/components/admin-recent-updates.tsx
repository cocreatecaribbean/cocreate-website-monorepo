import Link from 'next/link'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { AdminRecentActivityItem } from '@/lib/dashboard/types'
import { bricolage_grot600 } from '@/styles/fonts'

type AdminRecentUpdatesProps = {
  items: AdminRecentActivityItem[]
}

export default function AdminRecentUpdates({ items }: AdminRecentUpdatesProps) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-app-muted">No recent workspace activity yet.</p>
  }

  return (
    <div className="mt-5 min-h-0 max-h-80 overflow-y-auto overscroll-y-contain pr-0.5">
      <ul className="divide-y divide-chambray/6">
      {items.map((item) => {
        const detail = [item.organizationName, item.projectTitle].filter(Boolean).join(' · ')
        const content = (
          <>
            <p className={`text-app-primary ${bricolage_grot600.className}`}>
              {item.summary ?? item.action}
            </p>
            <p className="mt-1 text-sm wrap-break-word text-app-muted">{detail}</p>
            <p className="mt-2 text-xs font-medium tracking-wide text-sanmarino">
              {formatRelativeTime(item.createdAt)}
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
    </div>
  )
}
