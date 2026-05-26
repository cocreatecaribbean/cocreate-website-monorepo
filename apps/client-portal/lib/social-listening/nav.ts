import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  FileText,
  LineChart,
  MessageSquare,
  PieChart,
  Quote,
} from 'lucide-react'

export type SocialListeningViewId =
  | 'summary'
  | 'mentions'
  | 'analysis'
  | 'sources'
  | 'quotes'
  | 'reports'

export type SocialListeningNavItem = {
  id: SocialListeningViewId
  label: string
  description: string
  icon: LucideIcon
}

export const SOCIAL_LISTENING_NAV: SocialListeningNavItem[] = [
  {
    id: 'mentions',
    label: 'Mentions',
    description: 'Volume, timing, and sentiment trends',
    icon: MessageSquare,
  },
  {
    id: 'summary',
    label: 'Summary',
    description: 'Key metrics and sentiment split',
    icon: PieChart,
  },
  {
    id: 'analysis',
    label: 'Analysis',
    description: 'Reach, engagement, and performance',
    icon: LineChart,
  },
  {
    id: 'sources',
    label: 'Sources',
    description: 'Where conversations happen',
    icon: BarChart3,
  },
  {
    id: 'quotes',
    label: 'Quotes',
    description: 'Notable posts and snippets',
    icon: Quote,
  },
]

export const SOCIAL_LISTENING_REPORTS: SocialListeningNavItem = {
  id: 'reports',
  label: 'Reports',
  description: 'Exports and scheduled digests',
  icon: FileText,
}

const VALID_VIEWS = new Set<string>([
  ...SOCIAL_LISTENING_NAV.map((item) => item.id),
  SOCIAL_LISTENING_REPORTS.id,
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
