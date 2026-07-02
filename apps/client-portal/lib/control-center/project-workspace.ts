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
export const PROJECT_ID_QUERY = 'projectId'

export function applyProjectWorkspaceParams(
  params: URLSearchParams,
  projectId: string | null,
  tab?: PortalProjectTabId,
): void {
  if (projectId) {
    params.set(PROJECT_ID_QUERY, projectId)
    if (tab && tab !== 'overview') {
      params.set(PROJECT_TAB_QUERY, tab)
    } else {
      params.delete(PROJECT_TAB_QUERY)
    }
    return
  }
  params.delete(PROJECT_ID_QUERY)
  params.delete(PROJECT_TAB_QUERY)
}

export function parsePortalProjectTab(value: string | null): PortalProjectTabId {
  if (value === 'messages') return 'progress'
  if (value && PORTAL_PROJECT_TAB_IDS.includes(value as PortalProjectTabId)) {
    return value as PortalProjectTabId
  }
  return 'overview'
}
