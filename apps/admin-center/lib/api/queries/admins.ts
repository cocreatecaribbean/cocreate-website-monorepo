'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { AdminRosterItem } from '@/lib/projects/api-types'

export function useAdminsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.admins.list(),
    queryFn: () => fetchAdminBff<AdminRosterItem[]>('/api/admins'),
  })
}
