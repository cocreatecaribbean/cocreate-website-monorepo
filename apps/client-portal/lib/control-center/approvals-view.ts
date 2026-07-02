export const APPROVALS_TAB_QUERY = 'approvalsTab'

export type ApprovalsTabId = 'active' | 'history'

export function parseApprovalsTab(value: string | null): ApprovalsTabId {
  if (value === 'history') return 'history'
  return 'active'
}
