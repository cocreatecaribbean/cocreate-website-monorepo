'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { uploadProjectFiles } from '@/lib/projects/fetch-projects-client'

export function useUploadProjectFilesMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      files,
      requestId,
    }: {
      files: File[]
      requestId?: string
    }) => uploadProjectFiles(projectId, files, requestId),
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.files.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
