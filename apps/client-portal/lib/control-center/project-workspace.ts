export type PortalProjectTabId =
  | 'overview'
  | 'onboarding'
  | 'progress'
  | 'files'
  | 'team'

export const PORTAL_PROJECT_TAB_IDS: PortalProjectTabId[] = [
  'overview',
  'onboarding',
  'progress',
  'files',
  'team',
]

export const PROJECT_TAB_QUERY = 'projectTab'

export function parsePortalProjectTab(value: string | null): PortalProjectTabId {
  if (value === 'messages') return 'progress'
  if (value && PORTAL_PROJECT_TAB_IDS.includes(value as PortalProjectTabId)) {
    return value as PortalProjectTabId
  }
  return 'overview'
}
