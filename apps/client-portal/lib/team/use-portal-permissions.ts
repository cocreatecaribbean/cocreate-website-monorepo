'use client'

import { usePortalProfileQuery } from '@/lib/api/queries/team'
import type { ControlCenterNavPermissions } from '@/lib/control-center/nav'

export function usePortalPermissions() {
  const { data: profile, isLoading } = usePortalProfileQuery()
  const p = profile?.permissions

  const permissions: ControlCenterNavPermissions = {
    canAccessTeamHub: Boolean(p?.canAccessTeamHub),
    canAccessOverview: Boolean(p?.canAccessOverview),
    canAccessActivity: Boolean(p?.canAccessActivity),
    canAccessGetHelp: Boolean(p?.canAccessGetHelp),
    isViewer: Boolean(p?.isViewer),
    isSocialAnalyst: Boolean(p?.isSocialAnalyst),
    isContributor: Boolean(p?.isContributor),
    isAdmin: Boolean(p?.isAdmin),
  }

  return {
    ...permissions,
    canCreateProject: Boolean(p?.canCreateProject),
    canSendMessages: Boolean(p?.canSendMessages),
    canReactToFiles: Boolean(p?.canReactToFiles),
    canUseSocialListening: Boolean(p?.canUseSocialListening),
    canViewSocialListening: Boolean(p?.canViewSocialListening ?? p?.canUseSocialListening),
    canManageSocialListeningSetup: Boolean(
      p?.canManageSocialListeningSetup ?? p?.canCreateSocialListeningReports,
    ),
    canCreateSocialListeningReports: Boolean(p?.canCreateSocialListeningReports),
    canPromoteToAdmin: Boolean(p?.canPromoteToAdmin),
    loaded: !isLoading,
    permissions,
  }
}
