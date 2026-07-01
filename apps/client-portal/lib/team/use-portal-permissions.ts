'use client'

import { usePortalProfileQuery } from '@/lib/api/queries/team'

export function usePortalPermissions() {
  const { data: profile, isLoading } = usePortalProfileQuery()
  return {
    canAccessTeamHub: Boolean(profile?.permissions.canAccessTeamHub),
    loaded: !isLoading,
  }
}
