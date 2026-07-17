'use client'

import { Suspense, useCallback, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ControlCenterSidebar from '@/components/control-center/control-center-sidebar'
import {
  buildControlCenterNavItems,
  CONTROL_CENTER_NAV,
  CONTROL_CENTER_SETTINGS,
  parseControlCenterView,
  CONTROL_CENTER_VIEW_QUERY,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import { applyControlCenterViewParams } from '@/lib/control-center/use-control-center-nav'
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
  const [projectsListKey, setProjectsListKey] = useState(0)
  const { permissions } = usePortalPermissions()
  const navItems = buildControlCenterNavItems(permissions)
  const requestedView = parseControlCenterView(searchParams.get(CONTROL_CENTER_VIEW_QUERY))
  const activeView =
    requestedView === 'settings' || navItems.some((item) => item.id === requestedView)
      ? requestedView
      : (navItems[0]?.id ?? 'settings')

  const setActiveView = useCallback(
    (view: ControlCenterViewId) => {
      if (view === 'projects') {
        setProjectsListKey((key) => key + 1)
      }
      const params = new URLSearchParams(searchParams.toString())
      applyControlCenterViewParams(params, view)
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
      <div className="hidden h-full min-h-0 w-[220px] shrink-0 lg:block xl:w-[240px]">
        <ControlCenterSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          organizationName={organizationName}
        />
      </div>

      <div className="portal-sl-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
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
