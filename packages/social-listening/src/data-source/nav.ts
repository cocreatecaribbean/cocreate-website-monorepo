import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  FileText,
  LineChart,
  MessageSquare,
  PieChart,
  Quote,
  Settings,
} from 'lucide-react'

export type SocialListeningViewId =
  | 'summary'
  | 'mentions'
  | 'analysis'
  | 'sources'
  | 'quotes'
  | 'reports'
  | 'setup'

/** Shown when opening the + shortcut (not in main nav list). */
export const SOCIAL_LISTENING_SETUP = {
  id: 'setup' as const,
  label: 'New listening setup',
  description: 'Configure keywords, platforms, and date range for mention tracking',
}

export type SocialListeningNavItem = {
  id: SocialListeningViewId
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
}

export const SOCIAL_LISTENING_NAV: SocialListeningNavItem[] = [
  {
    id: 'summary',
    label: 'Summary',
    shortLabel: 'Summary',
    description: 'Key metrics and sentiment split',
    icon: PieChart,
  },
  {
    id: 'mentions',
    label: 'Mentions',
    shortLabel: 'Mentions',
    description: 'Volume, timing, and sentiment trends',
    icon: MessageSquare,
  },
  {
    id: 'analysis',
    label: 'Analysis',
    shortLabel: 'Stats',
    description: 'Reach, engagement, and performance',
    icon: LineChart,
  },
  {
    id: 'sources',
    label: 'Sources',
    shortLabel: 'Sources',
    description: 'Where conversations happen',
    icon: BarChart3,
  },
]

/** Hidden from main nav until Brand24 quotes ship — still reachable via direct URL */
export const SOCIAL_LISTENING_QUOTES_PREVIEW: SocialListeningNavItem = {
  id: 'quotes',
  label: 'Quotes',
  shortLabel: 'Quotes',
  description: 'Preview — notable posts (coming soon)',
  icon: Quote,
}

export const SOCIAL_LISTENING_REPORTS: SocialListeningNavItem = {
  id: 'reports',
  label: 'Reports',
  shortLabel: 'Reports',
  description: 'PDF exports (Growth+ plans)',
  icon: FileText,
}

const VALID_VIEWS = new Set<string>([
  ...SOCIAL_LISTENING_NAV.map((item) => item.id),
  SOCIAL_LISTENING_QUOTES_PREVIEW.id,
  SOCIAL_LISTENING_REPORTS.id,
  SOCIAL_LISTENING_SETUP.id,
])

export function parseSocialListeningView(
  value: string | null,
): SocialListeningViewId {
  if (value && VALID_VIEWS.has(value)) {
    return value as SocialListeningViewId
  }
  return 'summary'
}

export const SOCIAL_LISTENING_VIEW_QUERY = 'view'

/** Settings nav item for client portal (query key matches portal tab routing). */
export const DEFAULT_SETTINGS_NAV = {
  id: 'settings' as const,
  label: 'Settings',
  shortLabel: 'Settings',
  description: 'Appearance and portal preferences',
  icon: Settings,
  queryKey: 'ccView',
}

export function isSettingsView(
  value: string | null,
  settingsId = DEFAULT_SETTINGS_NAV.id,
): boolean {
  return value === settingsId
}
