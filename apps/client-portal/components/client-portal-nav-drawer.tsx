'use client'

import { Suspense, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Radio, Sparkles, X, type LucideIcon } from 'lucide-react'
import NavTooltip from '@cocreate/app-ui/nav-tooltip'
import ControlCenterAttentionLink from '@/components/control-center/control-center-attention-link'
import { useOrgInboxUnreadCountQuery } from '@/lib/api/queries/inbox'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import {
  buildControlCenterNavItems,
  CONTROL_CENTER_SETTINGS,
  CONTROL_CENTER_VIEW_QUERY,
  parseControlCenterView,
  type ControlCenterNavItem,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import { applyControlCenterViewParams } from '@/lib/control-center/use-control-center-nav'
import { resolveCanUseSocialListening } from '@/lib/portal-profile-types'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'
import { bricolage_grot600 } from '@/styles/fonts'
import {
  DEFAULT_SETTINGS_NAV,
  isSettingsView,
  SOCIAL_LISTENING_NAV,
  SOCIAL_LISTENING_REPORTS,
  SOCIAL_LISTENING_VIEW_QUERY,
  parseSocialListeningView,
  type SocialListeningNavItem,
  type SocialListeningViewId,
} from '@cocreate/social-listening/data-source'

const TAB_QUERY_KEY = 'tab'

type WorkspaceId = 'control-center' | 'social-listening'

type ClientPortalNavDrawerProps = {
  organizationName?: string | null
  hasSocialListening?: boolean
  onClose: () => void
}

function parseWorkspace(tab: string | null): WorkspaceId {
  return tab === 'social-listening' ? 'social-listening' : 'control-center'
}

function DrawerNavButton({
  label,
  icon: Icon,
  active,
  onSelect,
  badge,
  description,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onSelect: () => void
  badge?: string
  description?: string
}) {
  return (
    <NavTooltip description={description} className="w-full">
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'page' : undefined}
        className={`portal-drawer-nav-item w-full ${active ? 'portal-drawer-nav-item--active' : 'portal-drawer-nav-item--idle'}`}
      >
        <Icon
          className="portal-drawer-nav-icon h-5 w-5 shrink-0"
          strokeWidth={1.75}
          aria-hidden
        />
        <span>{label}</span>
        {badge ? (
          <span className="ml-auto rounded-full bg-casablanca/90 px-2 py-0.5 text-xs text-chambray tabular-nums">
            {badge}
          </span>
        ) : null}
      </button>
    </NavTooltip>
  )
}

function SectionNavButton({
  item,
  active,
  onSelect,
  badge,
}: {
  item: ControlCenterNavItem | SocialListeningNavItem
  active: boolean
  onSelect: () => void
  badge?: string
}) {
  return (
    <DrawerNavButton
      label={item.label}
      icon={item.icon}
      active={active}
      onSelect={onSelect}
      badge={badge}
      description={item.description}
    />
  )
}

function ClientPortalNavDrawerInner({
  organizationName,
  hasSocialListening: hasSocialListeningProp,
  onClose,
}: ClientPortalNavDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { permissions, canViewSocialListening, isAdmin } = usePortalPermissions()
  const { data: profile } = usePortalProfileQuery()
  // Entitled SL workspace (view analytics). Admins without subscription still
  // need the nav entry for billing/subscribe UI.
  const hasSocialListening =
    canViewSocialListening ||
    (hasSocialListeningProp ??
      (profile ? resolveCanUseSocialListening(profile) : false))
  const showSocialListeningNav =
    hasSocialListening || isAdmin || permissions.isSocialAnalyst
  const workspace = permissions.isSocialAnalyst
    ? 'social-listening'
    : parseWorkspace(searchParams.get(TAB_QUERY_KEY))
  const ccView = parseControlCenterView(searchParams.get(CONTROL_CENTER_VIEW_QUERY))
  const slView = parseSocialListeningView(searchParams.get(SOCIAL_LISTENING_VIEW_QUERY))
  const settingsOpen = isSettingsView(
    searchParams.get(DEFAULT_SETTINGS_NAV.queryKey),
    DEFAULT_SETTINGS_NAV.id,
  )

  const ccNavItems = buildControlCenterNavItems(permissions)
  const { data: inboxUnread = 0 } = useOrgInboxUnreadCountQuery()

  const workspaceLabel = organizationName?.trim() || 'Workspace'

  const navigate = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const targetPath = pathname.startsWith('/attention') ? '/' : pathname
      const query = params.toString()
      router.replace(query ? `${targetPath}?${query}` : targetPath, { scroll: false })
      // Close after this tap finishes so the departing drawer cannot ghost-click Sign out.
      window.setTimeout(() => onClose(), 0)
    },
    [onClose, pathname, router, searchParams],
  )

  const selectWorkspace = (next: WorkspaceId) => {
    navigate((params) => {
      if (next === 'social-listening') {
        params.set(TAB_QUERY_KEY, 'social-listening')
      } else {
        params.delete(TAB_QUERY_KEY)
      }
    })
  }

  const selectCcView = (view: ControlCenterViewId) => {
    navigate((params) => {
      params.delete(TAB_QUERY_KEY)
      applyControlCenterViewParams(params, view)
    })
  }

  const selectSlView = (view: SocialListeningViewId) => {
    navigate((params) => {
      params.set(TAB_QUERY_KEY, 'social-listening')
      params.delete(DEFAULT_SETTINGS_NAV.queryKey)
      if (view === 'summary') {
        params.delete(SOCIAL_LISTENING_VIEW_QUERY)
      } else {
        params.set(SOCIAL_LISTENING_VIEW_QUERY, view)
      }
    })
  }

  const openSettings = () => {
    navigate((params) => {
      if (workspace === 'social-listening') {
        params.set(TAB_QUERY_KEY, 'social-listening')
      } else {
        params.delete(TAB_QUERY_KEY)
      }
      params.set(DEFAULT_SETTINGS_NAV.queryKey, DEFAULT_SETTINGS_NAV.id)
    })
  }

  const slSettingsItem: SocialListeningNavItem = {
    id: 'summary',
    label: DEFAULT_SETTINGS_NAV.label,
    shortLabel: DEFAULT_SETTINGS_NAV.shortLabel,
    description: DEFAULT_SETTINGS_NAV.description,
    icon: DEFAULT_SETTINGS_NAV.icon,
  }

  const ccSettingsActive = workspace === 'control-center' && ccView === CONTROL_CENTER_SETTINGS.id
  const slSettingsActive = workspace === 'social-listening' && settingsOpen

  return (
    <div
      className={`flex h-full flex-col px-4 py-6 sm:px-6 sm:py-8 ${bricolage_grot600.className}`}
      aria-label="Client portal navigation"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Client Portal
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-white">{workspaceLabel}</p>
        </div>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
        Workspace
      </p>
      <nav className="mb-4 flex flex-col gap-1 border-b border-white/10 pb-4">
        {permissions.isSocialAnalyst ? null : (
          <DrawerNavButton
            label="Control Center"
            icon={LayoutDashboard}
            active={workspace === 'control-center'}
            onSelect={() => selectWorkspace('control-center')}
            description="Projects, files, messages, and day-to-day client work"
          />
        )}
        {showSocialListeningNav ? (
          <DrawerNavButton
            label="Social Listening"
            icon={Radio}
            active={workspace === 'social-listening'}
            onSelect={() => selectWorkspace('social-listening')}
            description="Brand mentions, analytics, and listening reports"
          />
        ) : null}
      </nav>

      {workspace === 'control-center' ? (
        <>
          <div className="mb-3 px-3">
            <ControlCenterAttentionLink onNavigate={onClose} />
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {ccNavItems.map((item) => (
              <SectionNavButton
                key={item.id}
                item={item}
                active={!ccSettingsActive && ccView === item.id}
                onSelect={() => selectCcView(item.id)}
                badge={
                  item.id === 'messages' && inboxUnread > 0
                    ? String(inboxUnread)
                    : undefined
                }
              />
            ))}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            <SectionNavButton
              item={CONTROL_CENTER_SETTINGS}
              active={ccSettingsActive}
              onSelect={() => selectCcView(CONTROL_CENTER_SETTINGS.id)}
            />
          </div>
        </>
      ) : hasSocialListening ? (
        <>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {SOCIAL_LISTENING_NAV.map((item) => (
              <SectionNavButton
                key={item.id}
                item={item}
                active={!slSettingsActive && slView === item.id}
                onSelect={() => selectSlView(item.id)}
              />
            ))}
          </nav>
          <div className="mt-6 space-y-1 border-t border-white/10 pt-4">
            <SectionNavButton
              item={SOCIAL_LISTENING_REPORTS}
              active={!slSettingsActive && slView === SOCIAL_LISTENING_REPORTS.id}
              onSelect={() => selectSlView(SOCIAL_LISTENING_REPORTS.id)}
            />
            <SectionNavButton
              item={slSettingsItem}
              active={slSettingsActive}
              onSelect={openSettings}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col px-3">
          <p className="text-sm leading-relaxed text-white/70">
            Subscribe to unlock brand analytics, mentions, and reports for your organization.
          </p>
          <nav className="mt-4 flex flex-col gap-1">
            <DrawerNavButton
              label="View plans"
              icon={Sparkles}
              active
              onSelect={() => selectWorkspace('social-listening')}
            />
          </nav>
        </div>
      )}
    </div>
  )
}

export default function ClientPortalNavDrawer(props: ClientPortalNavDrawerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col px-4 py-6 sm:px-6 sm:py-8" aria-hidden>
          <div className="mb-8 h-10 w-40 rounded-lg bg-white/10" />
          <div className="flex flex-1 flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      }
    >
      <ClientPortalNavDrawerInner {...props} />
    </Suspense>
  )
}
