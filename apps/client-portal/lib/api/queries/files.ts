'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { fetchFilesLibrary } from '@/lib/projects/fetch-projects-client'
import type { FilesQuery } from '@/lib/projects/api-types'

export function useFilesLibraryQuery(query?: FilesQuery) {
  return useQuery({
    queryKey: queryKeys.files.library(query),
    queryFn: () => fetchFilesLibrary(query),
  })
}
