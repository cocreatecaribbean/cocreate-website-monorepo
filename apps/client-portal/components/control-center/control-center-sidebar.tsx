'use client'

import ControlCenterAttentionLink from '@/components/control-center/control-center-attention-link'
import ThemeToggle from '@/components/theme-toggle'
import { useOrgInboxUnreadCountQuery } from '@/lib/api/queries/inbox'
import {
  buildControlCenterNavItems,
  CONTROL_CENTER_SETTINGS,
  type ControlCenterNavItem,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { X } from 'lucide-react'
import NavTooltip from '@cocreate/app-ui/nav-tooltip'

type ControlCenterSidebarProps = {
  activeView: ControlCenterViewId
  onSelectView: (view: ControlCenterViewId) => void
  organizationName?: string | null
  onNavigate?: () => void
  showClose?: boolean
  onClose?: () => void
}

function NavButton({
  item,
  active,
  onSelect,
  badge,
  onNavigate,
}: {
  item: ControlCenterNavItem
  active: boolean
  onSelect: () => void
  badge?: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavTooltip description={item.description} className="w-full">
      <button
        type="button"
        onClick={() => {
          onSelect()
          onNavigate?.()
        }}
        aria-current={active ? 'page' : undefined}
        className={`
        portal-sl-nav-item group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition
        ${bricolage_grot600.className}
        ${
          active
            ? 'bg-white/12 text-casablanca shadow-[inset_3px_0_0_0] shadow-casablanca'
            : 'text-white/75 hover:bg-white/8 hover:text-white'
        }
      `}
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${active ? 'text-casablanca' : 'text-white/50 group-hover:text-white/80'}`}
          aria-hidden
        />
        <span className="flex-1">{item.label}</span>
        {badge ? (
          <span className="rounded-full bg-casablanca/20 px-2 py-0.5 text-[0.65rem] font-semibold text-casablanca">
            {badge}
          </span>
        ) : null}
      </button>
    </NavTooltip>
  )
}

export default function ControlCenterSidebar({
  activeView,
  onSelectView,
  organizationName,
  onNavigate,
  showClose = false,
  onClose,
}: ControlCenterSidebarProps) {
  const workspaceLabel = organizationName?.trim() || 'Workspace'
  const { permissions } = usePortalPermissions()
  const navItems = buildControlCenterNavItems(permissions)
  const { data: inboxUnread = 0 } = useOrgInboxUnreadCountQuery()
  const messagesBadge = inboxUnread > 0 ? String(inboxUnread) : undefined

  return (
    <aside
      className="portal-sl-sidebar flex h-full min-h-0 flex-col"
      aria-label="Control center navigation"
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-[0.65rem] font-semibold tracking-[0.22em] text-white/45 uppercase ${bricolage_grot700.className}`}
            >
              Control Center
            </p>
            <p
              className={`mt-3 truncate text-sm font-semibold tracking-wide text-white ${bricolage_grot700.className}`}
            >
              {workspaceLabel}
            </p>
          </div>
          {showClose ? (
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
        <ControlCenterAttentionLink />
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onSelect={() => onSelectView(item.id)}
            onNavigate={onNavigate}
            badge={item.id === 'messages' ? messagesBadge : undefined}
          />
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/10 px-2 py-3">
        <ThemeToggle variant="sidebar" />
        <NavButton
          item={CONTROL_CENTER_SETTINGS}
          active={activeView === CONTROL_CENTER_SETTINGS.id}
          onSelect={() => onSelectView(CONTROL_CENTER_SETTINGS.id)}
          onNavigate={onNavigate}
        />
      </div>
    </aside>
  )
}
