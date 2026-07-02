import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestItem } from '@/lib/projects/api-types'

type RemoveThreadAttachmentResponse = {
  ok: boolean
  message?: string
  thread?: ProjectRequestItem
}

function removeAttachmentErrorMessage(status: number, data: unknown): string {
  if (typeof data === 'object' && data && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (status === 403) return 'You do not have permission to remove this file'
  if (status === 404) return 'File not found'
  return 'Could not remove file'
}

export async function removeThreadAttachment(
  queryClient: QueryClient,
  input: {
    requestId: string
    messageId: string
    attachmentId: string
    projectId?: string
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch(
    `/api/attachments/${input.attachmentId}?messageId=${encodeURIComponent(input.messageId)}`,
    { method: 'DELETE', cache: 'no-store', credentials: 'include' },
  )
  const data = (await response.json().catch(() => null)) as RemoveThreadAttachmentResponse | null

  if (!response.ok) {
    return {
      ok: false,
      message: removeAttachmentErrorMessage(response.status, data),
    }
  }

  if (data?.thread) {
    const threadQueryKey = queryKeys.requests.detail(input.requestId)
    await queryClient.cancelQueries({ queryKey: threadQueryKey })
    queryClient.setQueryData(threadQueryKey, data.thread)
  }

  if (input.projectId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projects.detail(input.projectId),
    })
  }

  return { ok: true }
}
