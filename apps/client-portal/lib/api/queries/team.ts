'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { usePortalProfileSeed } from '@/components/portal-profile-provider'
import {
  fetchOrgTeam,
  fetchPortalProfile,
  fetchProjectMembers,
  fetchTeamHub,
} from '@/lib/team/fetch-team-client'

export function usePortalProfileQuery() {
  const seed = usePortalProfileSeed()
  return useQuery({
    queryKey: queryKeys.profile.portal(),
    queryFn: fetchPortalProfile,
    initialData: seed ?? undefined,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTeamHubQuery() {
  return useQuery({
    queryKey: queryKeys.team.hub(),
    queryFn: fetchTeamHub,
  })
}

export function useOrgTeamQuery() {
  return useQuery({
    queryKey: queryKeys.team.org(),
    queryFn: fetchOrgTeam,
  })
}

export function useProjectMembersQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.team.projectMembers(projectId),
    queryFn: () => fetchProjectMembers(projectId),
    enabled: Boolean(projectId),
  })
}
