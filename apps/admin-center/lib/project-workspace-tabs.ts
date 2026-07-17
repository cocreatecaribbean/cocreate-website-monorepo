export type ProjectWorkspaceTabId =
  | 'overview'
  | 'onboarding'
  | 'progress'
  | 'files'
  | 'top-picks'
  | 'team-review'
  | 'collaborators'
  | 'client-team'

export const PROJECT_WORKSPACE_TAB_IDS: ProjectWorkspaceTabId[] = [
  'overview',
  'onboarding',
  'progress',
  'files',
  'top-picks',
  'team-review',
  'collaborators',
  'client-team',
]

export function parseProjectWorkspaceTab(
  value: string | null | undefined,
  isOnboarded = true,
): ProjectWorkspaceTabId {
  if (value === 'approvals') {
    return 'top-picks'
  }
  if (value === 'threads') {
    return isOnboarded ? 'progress' : 'onboarding'
  }
  if (value && PROJECT_WORKSPACE_TAB_IDS.includes(value as ProjectWorkspaceTabId)) {
    return value as ProjectWorkspaceTabId
  }
  return 'overview'
}
