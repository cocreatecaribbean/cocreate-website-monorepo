import { adminApiHeaders } from '@/lib/admin-api-headers'
import type { AdminRecentActivityItem } from '@/lib/dashboard/types'

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function fetchAdminRecentActivity(
  limit = 15,
): Promise<AdminRecentActivityItem[]> {
  const headers = await adminApiHeaders(true)
  if (!headers) return []

  try {
    const response = await fetch(
      `${apiBase()}/admin/dashboard/recent-activity?limit=${limit}`,
      { headers, cache: 'no-store' },
    )
    if (!response.ok) return []
    return (await response.json()) as AdminRecentActivityItem[]
  } catch {
    return []
  }
}
