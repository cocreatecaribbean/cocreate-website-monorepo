'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/query-keys'
import { reactionsMapFromItems } from '@/lib/projects/file-reaction-display'
import { fetchProjectFileReactions } from '@/lib/projects/fetch-projects-client'
import type {
  FileReactionsResponse,
  ProjectAttachmentWithReactions,
} from '@/lib/projects/api-types'

export function useProjectFileReactions(projectId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.fileReactions.project(projectId ?? ''),
    queryFn: () => fetchProjectFileReactions(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const reactionsById = useMemo(
    () => reactionsMapFromItems(query.data?.items ?? []),
    [query.data?.items],
  )

  return { ...query, reactionsById }
}

export function useSyncFileReactionCache(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useCallback(
    (result: ProjectAttachmentWithReactions) => {
      if (!projectId) return

      queryClient.setQueryData<FileReactionsResponse>(
        queryKeys.fileReactions.project(projectId),
        (prev) => {
          const items = prev?.items ?? []
          const without = items.filter((item) => item.id !== result.id)
          if (!result.myReaction && result.tags.length === 0) {
            return { items: without }
          }
          return { items: [result, ...without] }
        },
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.topPicks.all })
    },
    [projectId, queryClient],
  )
}
