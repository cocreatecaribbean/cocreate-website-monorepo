'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  AdminOrgTeamListResponseSchema,
  AdminTeamInviteRequestsResponseSchema,
} from '@cocreate/api-contracts/v1/admin-portal'
import type {
  TeamInviteRequestSummary,
  TeamMemberSummary,
} from '@/lib/projects/api-types'

export function useClientTeamQuery(organizationId: string) {
  return useQuery({
    queryKey: adminQueryKeys.team.members(organizationId),
    queryFn: async () => {
      const [membersRes, invitesRes] = await Promise.all([
        fetchAdminBff<unknown>(`/api/clients/${organizationId}/team`),
        fetchAdminBff<unknown>(
          `/api/clients/${organizationId}/team/invite-requests?status=PENDING`,
        ),
      ])
      const membersParsed = parseApiResponseSafe(AdminOrgTeamListResponseSchema, membersRes)
      const invitesParsed = parseApiResponseSafe(
        AdminTeamInviteRequestsResponseSchema,
        invitesRes,
      )
      return {
        members: (membersParsed?.members ?? []) as TeamMemberSummary[],
        inviteRequests: (invitesParsed?.requests ?? []) as TeamInviteRequestSummary[],
      }
    },
    enabled: Boolean(organizationId),
  })
}
