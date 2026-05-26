import { fetchAdminBff } from '@/lib/admin-api-fetch'

export async function fetchInboxUnreadCount(organizationId: string): Promise<number> {
  const data = await fetchAdminBff<{ count: number }>(
    `/api/clients/${organizationId}/inbox/unread-count`,
  )
  return data.count ?? 0
}

export async function markInboxRead(
  organizationId: string,
  requestId?: string,
): Promise<void> {
  await fetchAdminBff(`/api/clients/${organizationId}/inbox/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestId ? { requestId } : {}),
  })
}
