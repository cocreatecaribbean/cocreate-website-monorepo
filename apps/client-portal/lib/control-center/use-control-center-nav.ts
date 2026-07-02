'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  CONTROL_CENTER_VIEW_QUERY,
  parseControlCenterView,
  type ControlCenterViewId,
} from '@/lib/control-center/nav'
import { PROJECT_ID_QUERY, PROJECT_TAB_QUERY } from '@/lib/control-center/project-workspace'
import { APPROVALS_TAB_QUERY } from '@/lib/control-center/approvals-view'

export const CC_SHOW_PROJECTS_LIST_KEY = 'cc-show-projects-list'

export function applyControlCenterViewParams(
  params: URLSearchParams,
  view: ControlCenterViewId,
): void {
  if (view === 'overview') {
    params.delete(CONTROL_CENTER_VIEW_QUERY)
  } else {
    params.set(CONTROL_CENTER_VIEW_QUERY, view)
  }
  if (view === 'projects' && typeof window !== 'undefined') {
    sessionStorage.setItem(CC_SHOW_PROJECTS_LIST_KEY, '1')
  }
  params.delete(PROJECT_ID_QUERY)
  params.delete(PROJECT_TAB_QUERY)
  params.delete('requestId')
  params.delete('conversationId')
  if (view !== 'approvals') {
    params.delete(APPROVALS_TAB_QUERY)
    params.delete('attachmentId')
    params.delete('approvalItemId')
  }
}

export function useControlCenterNav(options?: {
  onNavigate?: () => void
  leaveAttentionForHome?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeView = parseControlCenterView(searchParams.get(CONTROL_CENTER_VIEW_QUERY))

  const navigateToView = useCallback(
    (view: ControlCenterViewId) => {
      const params = new URLSearchParams(searchParams.toString())
      applyControlCenterViewParams(params, view)
      const targetPath =
        options?.leaveAttentionForHome && pathname.startsWith('/attention') ? '/' : pathname
      const query = params.toString()
      router.replace(query ? `${targetPath}?${query}` : targetPath, { scroll: false })
      options?.onNavigate?.()
    },
    [options, pathname, router, searchParams],
  )

  return { activeView, navigateToView }
}
