'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatAttentionStatusLabel } from '@/lib/control-center/attention-items'
import type { PortalNotificationItem } from '@/lib/projects/api-types'
import {
  dispatchPortalNotificationsRefresh,
  fetchAttentionItems,
  markNotificationRead,
} from '@/lib/projects/fetch-projects-client'
import { alkatra600, bricolage_grot600 } from '@/styles/fonts'
import { ArrowLeft, Bell } from 'lucide-react'

type AttentionItemsPageProps = {
  organizationName?: string | null
}

function attentionHrefToPath(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return `${url.pathname}${url.search}`
  } catch {
    return href.startsWith('/') ? href : null
  }
}

export default function AttentionItemsPage({ organizationName }: AttentionItemsPageProps) {
  const router = useRouter()
  const workspaceLabel = organizationName?.trim() || 'your workspace'
  const [items, setItems] = useState<PortalNotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setItems(await fetchAttentionItems())
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const onOpen = (item: PortalNotificationItem) => {
    if (item.href) {
      const path = item.href.startsWith('http')
        ? attentionHrefToPath(item.href)
        : item.href.startsWith('/')
          ? item.href
          : null

      if (path) {
        router.push(path)
      } else if (item.href.startsWith('http')) {
        window.location.href = item.href
      }
    }

    void (async () => {
      try {
        await markNotificationRead(item.id)
        dispatchPortalNotificationsRefresh()
      } catch {
        /* non-blocking */
      }
    })()
  }

  const count = items.length

  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-gradient-hero portal-shine-hover portal-animate-in relative overflow-hidden p-6 sm:p-8">
        <div className="relative">
          <Link
            href="/?ccView=overview"
            className={`inline-flex items-center gap-2 text-sm text-sanmarino transition hover:text-chambray ${bricolage_grot600.className}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Control Center
          </Link>
          <p className="portal-eyebrow mt-6">Notifications</p>
          <h1
            className={`brand-gradient-text mt-2 bg-linear-to-r from-chambray via-sanmarino to-chambray bg-clip-text text-xl text-transparent sm:text-2xl ${alkatra600.className}`}
          >
            Items needing attention
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 ${bricolage_grot600.className}`}>
            {loading
              ? 'Loading…'
              : count === 0
                ? `Nothing is waiting on you in ${workspaceLabel} right now.`
                : `${formatAttentionStatusLabel(count)} in ${workspaceLabel}.`}
          </p>
        </div>
      </section>

      {loading ? null : count > 0 ? (
        <section className="space-y-4">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <article className="portal-glass-card portal-shine-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-casablanca/20 text-chambray">
                      <Bell className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className={`text-chambray ${bricolage_grot600.className}`}>{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {item.href ? (
                    <button
                      type="button"
                      onClick={() => onOpen(item)}
                      className="portal-btn-primary shrink-0 text-sm"
                    >
                      Open
                    </button>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
          <Link href="/?ccView=approvals" className="portal-btn-primary inline-flex">
            Open approvals
          </Link>
        </section>
      ) : (
        <section className="portal-surface-solid p-8 text-center">
          <p className={`text-sm text-slate-600 ${bricolage_grot600.className}`}>
            You are all caught up.
          </p>
          <Link href="/" className="portal-btn-primary mt-6 inline-flex">
            Return to workspace
          </Link>
        </section>
      )}
    </div>
  )
}
