'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ClientRecentActivityItem } from '@/lib/dashboard/types'
import {
  fetchClientRecentActivity,
  PORTAL_NOTIFICATIONS_REFRESH_EVENT,
} from '@/lib/projects/fetch-projects-client'

export function useClientRecentActivity(limit: number) {
  const [items, setItems] = useState<ClientRecentActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchClientRecentActivity(limit)
    setItems(data)
    setLoading(false)
  }, [limit])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onRefresh = () => void load()
    window.addEventListener(PORTAL_NOTIFICATIONS_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(PORTAL_NOTIFICATIONS_REFRESH_EVENT, onRefresh)
  }, [load])

  return { items, loading, reload: load }
}
