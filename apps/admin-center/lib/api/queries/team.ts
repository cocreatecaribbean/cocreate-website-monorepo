'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type {
  TeamInviteRequestSummary,
  TeamMemberSummary,
} from '@/lib/projects/api-types'

export function useClientTeamQuery(organizationId: string) {
  return useQuery({
    queryKey: adminQueryKeys.team.members(organizationId),
    queryFn: async () => {
      const [membersRes, invitesRes] = await Promise.all([
        fetchAdminBff<{ members: TeamMemberSummary[] }>(
          `/api/clients/${organizationId}/team`,
        ),
        fetchAdminBff<{ requests: TeamInviteRequestSummary[] }>(
          `/api/clients/${organizationId}/team/invite-requests?status=PENDING`,
        ).catch(() => ({ requests: [] as TeamInviteRequestSummary[] })),
      ])
      return {
        members: membersRes.members,
        inviteRequests: invitesRes.requests,
      }
    },
    enabled: Boolean(organizationId),
  })
}
