import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Users,
} from 'lucide-react'
import { PORTAL_SETTINGS } from '@/lib/portal/nav'
import type { PortalPermissions } from '@cocreate/api-contracts/v1/client-portal'

export type ControlCenterViewId =
  | 'overview'
  | 'projects'
  | 'activity'
  | 'messages'
  | 'team'
  | 'settings'

export type ControlCenterNavItem = {
  id: ControlCenterViewId
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
}

export const CONTROL_CENTER_NAV: ControlCenterNavItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    shortLabel: 'Home',
    description: 'Snapshot of projects, files, and actions',
    icon: LayoutDashboard,
  },
  {
    id: 'projects',
    label: 'Projects',
    shortLabel: 'Projects',
    description: 'Active workstreams with your CoCreate team',
    icon: FolderKanban,
  },
  {
    id: 'activity',
    label: 'Activity',
    shortLabel: 'Feed',
    description: 'Recent updates across your workspace',
    icon: Bell,
  },
  {
    id: 'messages',
    label: 'Get Help',
    shortLabel: 'Help',
    description: 'Ask CoCreate for help in a message thread',
    icon: MessageSquare,
  },
]

export const CONTROL_CENTER_TEAM: ControlCenterNavItem = {
  id: 'team',
  label: 'Team',
  shortLabel: 'Team',
  description: 'Organization members and project access',
  icon: Users,
}

export type ControlCenterNavPermissions = Pick<
  PortalPermissions,
  | 'canAccessOverview'
  | 'canAccessActivity'
  | 'canAccessGetHelp'
  | 'canAccessTeamHub'
  | 'isViewer'
  | 'isSocialAnalyst'
  | 'isContributor'
  | 'isAdmin'
>

/** Role-aware control-center nav. Social Analysts get an empty list (SL shell only). */
export function buildControlCenterNavItems(
  permissions: ControlCenterNavPermissions | boolean,
): ControlCenterNavItem[] {
  // Back-compat: older call sites passed only canAccessTeamHub
  const perms: ControlCenterNavPermissions =
    typeof permissions === 'boolean'
      ? {
          canAccessTeamHub: permissions,
          canAccessOverview: true,
          canAccessActivity: true,
          canAccessGetHelp: true,
          isViewer: false,
          isSocialAnalyst: false,
          isContributor: false,
          isAdmin: permissions,
        }
      : permissions

  if (perms.isSocialAnalyst) return []

  const canOverview = perms.canAccessOverview ?? perms.isAdmin ?? false
  const canActivity = perms.canAccessActivity ?? perms.isAdmin ?? false
  const canGetHelp = perms.canAccessGetHelp ?? false
  const canTeam = Boolean(perms.canAccessTeamHub)

  const items = CONTROL_CENTER_NAV.filter((item) => {
    if (item.id === 'overview') return canOverview
    if (item.id === 'activity') return canActivity
    if (item.id === 'messages') return canGetHelp
    return true // projects always
  })

  if (!canTeam) return items

  const messagesIndex = items.findIndex((item) => item.id === 'messages')
  const insertAt = messagesIndex >= 0 ? messagesIndex + 1 : items.length
  const withTeam = [...items]
  withTeam.splice(insertAt, 0, CONTROL_CENTER_TEAM)
  return withTeam
}

export const CONTROL_CENTER_SETTINGS: ControlCenterNavItem = {
  id: PORTAL_SETTINGS.id,
  label: PORTAL_SETTINGS.label,
  shortLabel: PORTAL_SETTINGS.label,
  description: PORTAL_SETTINGS.description,
  icon: PORTAL_SETTINGS.icon,
}

const VALID_VIEWS = new Set<string>([
  ...CONTROL_CENTER_NAV.map((item) => item.id),
  CONTROL_CENTER_TEAM.id,
  CONTROL_CENTER_SETTINGS.id,
])

export function parseControlCenterView(value: string | null): ControlCenterViewId {
  if (value === 'approvals' || value === 'files' || value === 'top-picks') {
    return 'projects'
  }
  if (value && VALID_VIEWS.has(value)) {
    return value as ControlCenterViewId
  }
  return 'overview'
}

/** Pick a safe default view given which nav items the user can see. */
export function defaultControlCenterView(
  navItems: ControlCenterNavItem[],
): ControlCenterViewId {
  if (navItems.some((item) => item.id === 'overview')) return 'overview'
  if (navItems.some((item) => item.id === 'projects')) return 'projects'
  return 'settings'
}

export function resolveControlCenterView(
  value: string | null,
  navItems: ControlCenterNavItem[],
): ControlCenterViewId {
  const parsed = parseControlCenterView(value)
  if (parsed === 'settings') return 'settings'
  if (navItems.some((item) => item.id === parsed)) return parsed
  return defaultControlCenterView(navItems)
}

export const CONTROL_CENTER_VIEW_QUERY = 'ccView'
