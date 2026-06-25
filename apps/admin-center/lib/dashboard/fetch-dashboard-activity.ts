import { nestApiUrl } from '@cocreate/api-client'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import type { AdminRecentActivityItem } from '@/lib/dashboard/types'


export async function fetchAdminRecentActivity(
  limit = 15,
): Promise<AdminRecentActivityItem[]> {
  const headers = await adminApiHeaders(true)
  if (!headers) return []

  try {
    const response = await fetch(
      nestApiUrl(`/admin/dashboard/recent-activity?limit=${limit}`),
      { headers, cache: 'no-store' },
    )
    if (!response.ok) return []
    return (await response.json()) as AdminRecentActivityItem[]
  } catch {
    return []
  }
}
