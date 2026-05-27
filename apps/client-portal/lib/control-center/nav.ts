import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  CheckCircle2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Users,
} from 'lucide-react'
import { PORTAL_SETTINGS } from '@/lib/portal/nav'

export type ControlCenterViewId =
  | 'overview'
  | 'projects'
  | 'approvals'
  | 'files'
  | 'activity'
  | 'messages'
  | 'team'
  | 'settings'

export type ControlCenterNavItem = {
  id: ControlCenterViewId
  label: string
  description: string
  icon: LucideIcon
}

export const CONTROL_CENTER_NAV: ControlCenterNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Snapshot of projects, files, and actions',
    icon: LayoutDashboard,
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Active workstreams with your CoCreate team',
    icon: FolderKanban,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    description: 'Progress checks and approval history',
    icon: CheckCircle2,
  },
  {
    id: 'files',
    label: 'Files',
    description: 'Deliverables and shared assets',
    icon: FileText,
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Recent updates across your workspace',
    icon: Bell,
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Direct line to your account team',
    icon: MessageSquare,
  },
]

export const CONTROL_CENTER_TEAM: ControlCenterNavItem = {
  id: 'team',
  label: 'Team',
  description: 'Organization members and project access',
  icon: Users,
}

export function buildControlCenterNavItems(canAccessTeamHub: boolean): ControlCenterNavItem[] {
  if (!canAccessTeamHub) return [...CONTROL_CENTER_NAV]
  const items = [...CONTROL_CENTER_NAV]
  const messagesIndex = items.findIndex((item) => item.id === 'messages')
  items.splice(messagesIndex + 1, 0, CONTROL_CENTER_TEAM)
  return items
}

export const CONTROL_CENTER_SETTINGS: ControlCenterNavItem = {
  id: PORTAL_SETTINGS.id,
  label: PORTAL_SETTINGS.label,
  description: PORTAL_SETTINGS.description,
  icon: PORTAL_SETTINGS.icon,
}

const VALID_VIEWS = new Set<string>([
  ...CONTROL_CENTER_NAV.map((item) => item.id),
  CONTROL_CENTER_TEAM.id,
  CONTROL_CENTER_SETTINGS.id,
])

export function parseControlCenterView(value: string | null): ControlCenterViewId {
  if (value && VALID_VIEWS.has(value)) {
    return value as ControlCenterViewId
  }
  return 'overview'
}

export const CONTROL_CENTER_VIEW_QUERY = 'ccView'
