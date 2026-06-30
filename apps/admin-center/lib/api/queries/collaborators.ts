'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type {
  CollaboratorRosterItem,
  ProjectCollaboratorRosterItem,
  ProjectCollaboratorRow,
} from '@/lib/projects/api-types'

export function useCollaboratorsRosterQuery() {
  return useQuery({
    queryKey: adminQueryKeys.collaborators.roster(),
    queryFn: () => fetchAdminBff<CollaboratorRosterItem[]>('/api/collaborators'),
  })
}

export function useProjectCollaboratorsQuery(projectId: string) {
  return useQuery({
    queryKey: adminQueryKeys.collaborators.project(projectId),
    queryFn: async () => {
      const [collaborators, roster] = await Promise.all([
        fetchAdminBff<ProjectCollaboratorRow[]>(`/api/projects/${projectId}/collaborators`),
        fetchAdminBff<ProjectCollaboratorRosterItem[]>('/api/collaborators'),
      ])
      return { collaborators, roster }
    },
    enabled: Boolean(projectId),
  })
}
