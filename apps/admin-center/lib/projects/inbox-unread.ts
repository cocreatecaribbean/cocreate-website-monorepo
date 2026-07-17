import { fetchAdminBff } from '@/lib/admin-api-fetch'

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
