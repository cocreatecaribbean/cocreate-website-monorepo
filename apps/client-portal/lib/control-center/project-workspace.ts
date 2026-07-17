export type PortalProjectTabId =
  | 'overview'
  | 'onboarding'
  | 'progress'
  | 'files'
  | 'top-picks'
  | 'team'

export const PORTAL_PROJECT_TAB_IDS: PortalProjectTabId[] = [
  'overview',
  'onboarding',
  'progress',
  'files',
  'top-picks',
  'team',
]

/** Viewers only see Progress + Top Picks inside a project. */
export const VIEWER_PROJECT_TAB_IDS: PortalProjectTabId[] = ['progress', 'top-picks']

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

export function parsePortalProjectTab(
  value: string | null,
  options?: { isViewer?: boolean },
): PortalProjectTabId {
  if (value === 'messages') return 'progress'
  if (value === 'approvals') return 'top-picks'
  if (value && PORTAL_PROJECT_TAB_IDS.includes(value as PortalProjectTabId)) {
    const tab = value as PortalProjectTabId
    if (options?.isViewer && !VIEWER_PROJECT_TAB_IDS.includes(tab)) {
      return 'progress'
    }
    return tab
  }
  return options?.isViewer ? 'progress' : 'overview'
}
