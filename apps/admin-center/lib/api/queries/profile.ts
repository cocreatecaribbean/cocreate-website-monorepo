'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { AdminProfile, JobTitleOption, ProfileOption } from '@/lib/projects/api-types'

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: adminQueryKeys.profile.current(),
    queryFn: () => fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>('/api/profile'),
  })
}

export function useProfileOptionsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.profile.options(),
    queryFn: () =>
      fetchAdminBff<{ ok: boolean; jobTitles?: ProfileOption[] }>('/api/profile-options'),
  })
}

export function useAgencyProfileOptionsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.profile.settingsOptions(),
    queryFn: () => fetchAdminBff<JobTitleOption[]>('/api/settings/profile-options'),
  })
}

export function useAdminSessionQuery() {
  return useQuery({
    queryKey: adminQueryKeys.session.current(),
    queryFn: () =>
      fetchAdminBff<{
        ok?: boolean
        mode?: 'user' | 'api_key'
        admin?: {
          id: string
          email: string
          status: string
          role?: string
          profile?: {
            displayName?: string | null
            profileComplete?: boolean
          }
        } | null
      }>('/api/session'),
    staleTime: 5 * 60 * 1000,
  })
}
