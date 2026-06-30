'use client'

import ControlCenterAttentionLink from '@/components/control-center/control-center-attention-link'
import { useUnreadApprovalsCountQuery } from '@/lib/api/queries/approvals'
import {
  buildControlCenterNavItems,
  CONTROL_CENTER_SETTINGS,
  type ControlCenterNavItem,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

type ControlCenterSidebarProps = {
  activeView: ControlCenterViewId
  onSelectView: (view: ControlCenterViewId) => void
  organizationName?: string | null
}

function NavButton({
  item,
  active,
  onSelect,
  badge,
}: {
  item: ControlCenterNavItem
  active: boolean
  onSelect: () => void
  badge?: string
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      title={item.description}
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
  )
}

export default function ControlCenterSidebar({
  activeView,
  onSelectView,
  organizationName,
}: ControlCenterSidebarProps) {
  const workspaceLabel = organizationName?.trim() || 'Workspace'
  const { canAccessTeamHub } = usePortalPermissions()
  const navItems = buildControlCenterNavItems(canAccessTeamHub)
  const { data: unreadCount = 0 } = useUnreadApprovalsCountQuery()
  const approvalsBadge = unreadCount > 0 ? String(unreadCount) : undefined

  return (
    <aside
      className="portal-sl-sidebar flex h-full min-h-0 flex-col"
      aria-label="Control center navigation"
    >
      <div className="border-b border-white/10 px-4 py-4">
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
        <ControlCenterAttentionLink />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onSelect={() => onSelectView(item.id)}
            badge={item.id === 'approvals' ? approvalsBadge : undefined}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 px-2 py-3">
        <NavButton
          item={CONTROL_CENTER_SETTINGS}
          active={activeView === CONTROL_CENTER_SETTINGS.id}
          onSelect={() => onSelectView(CONTROL_CENTER_SETTINGS.id)}
        />
      </div>
    </aside>
  )
}
