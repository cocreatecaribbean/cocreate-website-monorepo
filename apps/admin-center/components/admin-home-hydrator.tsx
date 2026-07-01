'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { AdminDashboardStats, AdminRecentActivityItem } from '@/lib/dashboard/types'

export function AdminHomeHydrator({
  stats,
  activity,
  children,
}: {
  stats: AdminDashboardStats | null
  activity: AdminRecentActivityItem[]
  children: React.ReactNode
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (stats) {
      queryClient.setQueryData(adminQueryKeys.dashboard.stats(), stats)
    }
    queryClient.setQueryData(adminQueryKeys.dashboard.activity(15), activity)
  }, [activity, queryClient, stats])

  return children
}
