'use client'

import { useClientRecentActivityQuery } from '@/lib/api/queries/projects'

export function useClientRecentActivity(limit: number) {
  const { data: items = [], isLoading: loading, refetch } = useClientRecentActivityQuery(limit)
  return { items, loading, reload: () => void refetch() }
}
