import type { ProjectVideoRole } from '@cocreate/types'

const ROLE_LABELS: Record<ProjectVideoRole, string> = {
  final_ad: 'Final ad',
  making_of: 'Making of',
  hero_reel: 'Hero reel',
  other: 'Video',
}

export function projectVideoLabel(role: ProjectVideoRole, title?: string): string {
  return title?.trim() || ROLE_LABELS[role]
}
