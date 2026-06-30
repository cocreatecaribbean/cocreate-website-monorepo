'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  fetchOrgTeam,
  fetchPortalProfile,
  fetchProjectMembers,
  fetchTeamHub,
} from '@/lib/team/fetch-team-client'

export function usePortalProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile.portal(),
    queryFn: fetchPortalProfile,
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
