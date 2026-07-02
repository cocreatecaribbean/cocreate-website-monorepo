import type { QueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestItem } from '@/lib/projects/types'

type RemoveThreadAttachmentResponse = {
  ok: boolean
  thread?: ProjectRequestItem
}

export async function removeThreadAttachment(
  queryClient: QueryClient,
  input: {
    requestId: string
    messageId: string
    attachmentId: string
    organizationId?: string
    projectId?: string
  },
): Promise<void> {
  const result = await fetchAdminBff<RemoveThreadAttachmentResponse>(
    `/api/attachments/${input.attachmentId}?messageId=${encodeURIComponent(input.messageId)}`,
    { method: 'DELETE' },
  )

  if (result.thread) {
    const threadQueryKey = adminQueryKeys.requests.detail(input.requestId)
    await queryClient.cancelQueries({ queryKey: threadQueryKey })
    queryClient.setQueryData(threadQueryKey, result.thread)
  }

  if (input.organizationId && input.projectId) {
    void queryClient.invalidateQueries({
      queryKey: adminQueryKeys.projects.workspace(input.organizationId, input.projectId),
    })
  }
}
