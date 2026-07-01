'use client'

import { Suspense, useCallback, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ControlCenterSidebar from '@/components/control-center/control-center-sidebar'
import {
  buildControlCenterNavItems,
  CONTROL_CENTER_NAV,
  CONTROL_CENTER_SETTINGS,
  CONTROL_CENTER_VIEW_QUERY,
  parseControlCenterView,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import { PROJECT_TAB_QUERY } from '@/lib/control-center/project-workspace'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'

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
  const { canAccessTeamHub } = usePortalPermissions()
  const navItems = buildControlCenterNavItems(canAccessTeamHub)

  const setActiveView = useCallback(
    (view: ControlCenterViewId) => {
      const params = new URLSearchParams(searchParams.toString())
      if (view === 'overview') {
        params.delete(CONTROL_CENTER_VIEW_QUERY)
      } else {
        params.set(CONTROL_CENTER_VIEW_QUERY, view)
      }
      if (view === 'projects') {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cc-show-projects-list', '1')
        }
        setProjectsListKey((key) => key + 1)
      }
      params.delete('projectId')
      params.delete(PROJECT_TAB_QUERY)
      params.delete('requestId')
      params.delete('conversationId')
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const activeMeta =
    [...navItems, CONTROL_CENTER_SETTINGS].find((item) => item.id === activeView) ??
    CONTROL_CENTER_NAV[0]

  return (
    <div className="portal-sl-shell flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-0">
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
          <p className="mt-1 text-sm text-app-muted">{activeMeta.description}</p>
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
        <div className="py-12 text-center text-sm text-app-muted">Loading workspace…</div>
      }
    >
      <ControlCenterLayoutInner {...props} />
    </Suspense>
  )
}
