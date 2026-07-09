'use client'

import { Suspense, useCallback, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import SocialListeningSidebar from './social-listening-sidebar'
import SocialListeningMobileSubNav from './social-listening-mobile-subnav'
import type { MentionSnapshotHint } from '@cocreate/social-listening/core'
import {
  DEFAULT_SETTINGS_NAV,
  isSettingsView,
  SOCIAL_LISTENING_NAV,
  SOCIAL_LISTENING_REPORTS,
  SOCIAL_LISTENING_SETUP,
  SOCIAL_LISTENING_VIEW_QUERY,
  parseSocialListeningView,
  type SocialListeningViewId,
} from '@cocreate/social-listening/data-source'

type SocialListeningLayoutProps = {
  children: (activeView: SocialListeningViewId, settingsOpen: boolean) => ReactNode
  organizationName?: string | null
  organizationLogoUrl?: string | null
  mentionHint?: MentionSnapshotHint
  showSettings?: boolean
  showSetupShortcut?: boolean
}

function SocialListeningLayoutInner({
  children,
  organizationName,
  organizationLogoUrl,
  mentionHint,
  showSettings = true,
  showSetupShortcut = true,
}: SocialListeningLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeView = parseSocialListeningView(searchParams.get(SOCIAL_LISTENING_VIEW_QUERY))
  const settingsOpen = isSettingsView(
    searchParams.get(DEFAULT_SETTINGS_NAV.queryKey),
    DEFAULT_SETTINGS_NAV.id,
  )

  const mainNavItems = [...SOCIAL_LISTENING_NAV, SOCIAL_LISTENING_REPORTS]

  const setActiveView = useCallback(
    (view: SocialListeningViewId) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(DEFAULT_SETTINGS_NAV.queryKey)
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

  const openSettings = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(DEFAULT_SETTINGS_NAV.queryKey, DEFAULT_SETTINGS_NAV.id)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const activeMeta = settingsOpen
    ? DEFAULT_SETTINGS_NAV
    : activeView === SOCIAL_LISTENING_SETUP.id
      ? SOCIAL_LISTENING_SETUP
      : (mainNavItems.find((item) => item.id === activeView) ?? SOCIAL_LISTENING_NAV[0])

  return (
    <div className="portal-sl-shell flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-0">
      <div className="hidden w-[220px] shrink-0 lg:block xl:w-[240px]">
        <SocialListeningSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          settingsActive={settingsOpen}
          onOpenSettings={openSettings}
          organizationName={organizationName}
          organizationLogoUrl={organizationLogoUrl}
          mentionHint={mentionHint}
          showSettings={showSettings}
          showSetupShortcut={showSetupShortcut}
        />
      </div>

      <div className="portal-sl-main portal-sl-region flex min-h-0 min-w-0 flex-1 flex-col">
        <SocialListeningMobileSubNav
          activeView={activeView}
          onSelectView={setActiveView}
        />
        <header className="mb-4 shrink-0 px-1 lg:px-2">
          <p className="portal-eyebrow">{activeMeta.label}</p>
          <p className="portal-sl-body mt-1 text-sm">{activeMeta.description}</p>
        </header>
        <div className="min-h-0 flex-1">{children(activeView, settingsOpen)}</div>
      </div>
    </div>
  )
}

export default function SocialListeningLayout(props: SocialListeningLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-app-muted">Loading analytics…</div>
      }
    >
      <SocialListeningLayoutInner {...props} />
    </Suspense>
  )
}
