'use client'

import { Suspense, useCallback, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ControlCenterAttentionLink from '@/components/control-center/control-center-attention-link'
import ControlCenterSidebar from '@/components/control-center/control-center-sidebar'
import {
  CONTROL_CENTER_NAV,
  CONTROL_CENTER_SETTINGS,
  CONTROL_CENTER_VIEW_QUERY,
  parseControlCenterView,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import Link from 'next/link'
import { bricolage_grot600 } from '@/styles/fonts'

type ControlCenterLayoutProps = {
  children: (activeView: ControlCenterViewId, projectsListKey: number) => ReactNode
  organizationName?: string | null
}

function ControlCenterLayoutInner({
  children,
  organizationName,
}: ControlCenterLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeView = parseControlCenterView(searchParams.get(CONTROL_CENTER_VIEW_QUERY))
  const [projectsListKey, setProjectsListKey] = useState(0)

  const setActiveView = useCallback(
    (view: ControlCenterViewId) => {
      const params = new URLSearchParams(searchParams.toString())
      if (view === 'overview') {
        params.delete(CONTROL_CENTER_VIEW_QUERY)
      } else {
        params.set(CONTROL_CENTER_VIEW_QUERY, view)
      }
      // Sidebar navigation should show section lists, not stale deep links.
      if (view === 'projects') {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cc-show-projects-list', '1')
        }
        setProjectsListKey((key) => key + 1)
      }
      params.delete('projectId')
      params.delete('requestId')
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const activeMeta =
    [...CONTROL_CENTER_NAV, CONTROL_CENTER_SETTINGS].find((item) => item.id === activeView) ??
    CONTROL_CENTER_NAV[0]

  const navItems = [...CONTROL_CENTER_NAV, CONTROL_CENTER_SETTINGS]

  return (
    <div className="portal-sl-shell flex min-h-[min(70vh,640px)] flex-col gap-4 lg:flex-row lg:gap-0">
      <div
        className={`rounded-xl border border-casablanca/25 bg-casablanca/10 px-3 py-2 lg:hidden ${bricolage_grot600.className}`}
      >
        <ControlCenterAttentionLink />
      </div>
      <div className="portal-sl-mobile-nav overflow-x-auto lg:hidden">
        <div
          className="flex min-w-max gap-1 p-1"
          role="tablist"
          aria-label="Control center sections"
        >
          {navItems.map((item) => {
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
        <ControlCenterSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          organizationName={organizationName}
        />
      </div>

      <div className="portal-sl-main flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="mb-4 shrink-0 px-1 lg:px-2">
          <p className="portal-eyebrow">{activeMeta.label}</p>
          <p className="mt-1 text-sm text-slate-600">{activeMeta.description}</p>
        </header>
        <div className="min-h-0 flex-1">{children(activeView, projectsListKey)}</div>
      </div>
    </div>
  )
}

export default function ControlCenterLayout(props: ControlCenterLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">Loading workspace…</div>
      }
    >
      <ControlCenterLayoutInner {...props} />
    </Suspense>
  )
}
