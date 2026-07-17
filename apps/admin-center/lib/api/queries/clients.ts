'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type {
  ClientOrganizationRosterItem,
  ClientProjectSummary,
  ProjectActivityItem,
} from '@/lib/projects/types'

export function useClientsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.clients.list(),
    queryFn: () => fetchAdminBff<ClientOrganizationRosterItem[]>('/api/clients'),
  })
}

export function useClientProjectsQuery(organizationId: string) {
  return useQuery({
    queryKey: adminQueryKeys.projects.byOrganization(organizationId),
    queryFn: () =>
      fetchAdminBff<ClientProjectSummary[]>(`/api/clients/${organizationId}/projects`),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useClientActivityQuery(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.clients.activity(organizationId),
    queryFn: () =>
      fetchAdminBff<ProjectActivityItem[]>(`/api/clients/${organizationId}/activity`),
    enabled: Boolean(organizationId) && enabled,
  })
}

export function useClientDetailQuery(organizationId: string) {
  return useQuery({
    queryKey: adminQueryKeys.clients.detail(organizationId),
    queryFn: () =>
      fetchAdminBff<ClientOrganizationRosterItem>(`/api/clients/${organizationId}`),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  })
}
