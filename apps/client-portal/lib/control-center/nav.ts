import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  CheckCircle2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from 'lucide-react'

export type ControlCenterViewId =
  | 'overview'
  | 'projects'
  | 'approvals'
  | 'files'
  | 'activity'
  | 'messages'
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
    description: 'Items waiting for your sign-off',
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

export const CONTROL_CENTER_SETTINGS: ControlCenterNavItem = {
  id: 'settings',
  label: 'Settings',
  description: 'Notifications and portal preferences',
  icon: Settings,
}

const VALID_VIEWS = new Set<string>([
  ...CONTROL_CENTER_NAV.map((item) => item.id),
  CONTROL_CENTER_SETTINGS.id,
])

export function parseControlCenterView(value: string | null): ControlCenterViewId {
  if (value && VALID_VIEWS.has(value)) {
    return value as ControlCenterViewId
  }
  return 'overview'
}

export const CONTROL_CENTER_VIEW_QUERY = 'ccView'
