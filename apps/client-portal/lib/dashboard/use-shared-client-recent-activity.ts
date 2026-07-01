'use client'

import { useClientRecentActivityQuery } from '@/lib/api/queries/projects'

const SHARED_ACTIVITY_LIMIT = 25

export function useSharedClientRecentActivity() {
  const query = useClientRecentActivityQuery(SHARED_ACTIVITY_LIMIT)
  return {
    ...query,
    allItems: query.data ?? [],
    overviewItems: (query.data ?? []).slice(0, 8),
  }
}
