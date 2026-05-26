'use client'

import { Suspense, useCallback, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import SocialListeningSidebar from '@/components/social-listening/social-listening-sidebar'
import type { MentionSnapshotHint } from '@/lib/social-listening/mention-snapshot-hint'
import {
  SOCIAL_LISTENING_NAV,
  SOCIAL_LISTENING_REPORTS,
  SOCIAL_LISTENING_VIEW_QUERY,
  parseSocialListeningView,
  type SocialListeningViewId,
} from '@/lib/social-listening/nav'
import { bricolage_grot600 } from '@/styles/fonts'

type SocialListeningLayoutProps = {
  children: (activeView: SocialListeningViewId) => ReactNode
  organizationName?: string | null
  mentionHint?: MentionSnapshotHint
}

function SocialListeningLayoutInner({
  children,
  organizationName,
  mentionHint,
}: SocialListeningLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeView = parseSocialListeningView(searchParams.get(SOCIAL_LISTENING_VIEW_QUERY))

  const setActiveView = useCallback(
    (view: SocialListeningViewId) => {
      const params = new URLSearchParams(searchParams.toString())
      if (view === 'summary') {
        params.delete(SOCIAL_LISTENING_VIEW_QUERY)
      } else {
        params.set(SOCIAL_LISTENING_VIEW_QUERY, view)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const activeMeta =
    [...SOCIAL_LISTENING_NAV, SOCIAL_LISTENING_REPORTS].find((item) => item.id === activeView) ??
    SOCIAL_LISTENING_NAV[1]

  return (
    <div className="portal-sl-shell flex min-h-[min(70vh,720px)] flex-col gap-4 lg:flex-row lg:gap-0">
      {/* Mobile: horizontal section picker */}
      <div className="portal-sl-mobile-nav overflow-x-auto lg:hidden">
        <div
          className="flex min-w-max gap-1 p-1"
          role="tablist"
          aria-label="Social listening sections"
        >
          {[...SOCIAL_LISTENING_NAV, SOCIAL_LISTENING_REPORTS].map((item) => {
            const selected = activeView === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveView(item.id)}
                className={`
                  portal-sl-nav-item inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs whitespace-nowrap transition
                  ${bricolage_grot600.className}
                  ${
                    selected
                      ? 'bg-casablanca/25 text-casablanca ring-1 ring-casablanca/30'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="hidden w-[220px] shrink-0 lg:block xl:w-[240px]">
        <SocialListeningSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          organizationName={organizationName}
          mentionHint={mentionHint}
        />
      </div>

      <div className="portal-sl-main flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="mb-4 shrink-0 px-1 lg:px-2">
          <p className="portal-eyebrow">{activeMeta.label}</p>
          <p className="mt-1 text-sm text-slate-600">{activeMeta.description}</p>
        </header>
        <div className="min-h-0 flex-1">{children(activeView)}</div>
      </div>
    </div>
  )
}

export default function SocialListeningLayout(props: SocialListeningLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">Loading analytics…</div>
      }
    >
      <SocialListeningLayoutInner {...props} />
    </Suspense>
  )
}
