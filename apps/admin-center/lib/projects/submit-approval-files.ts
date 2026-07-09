import type { QueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { appendRequestMessageToCacheOrInvalidate } from '@/lib/projects/append-request-message-cache'
import type { StagedProjectFile } from '@/lib/projects/fetch-project-files'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'

export type SubmitApprovalFilesInput = {
  organizationId: string
  projectId: string
  progressRequestId: string
  title: string
  note?: string
  attachmentIds?: string[]
  stagedAttachments?: StagedProjectFile[]
}

type SendApprovalFilesResponse = {
  items: unknown[]
  sentMessage?: ProjectRequestMessage
  thread?: ProjectRequestItem
}

export async function submitApprovalFiles(
  queryClient: QueryClient,
  input: SubmitApprovalFilesInput,
) {
  const title = input.title.trim()
  const note = input.note?.trim()

  const result = await fetchAdminBff<SendApprovalFilesResponse>(
    `/api/projects/${input.projectId}/approvals`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        ...(note ? { note } : {}),
        ...(input.attachmentIds?.length ? { attachmentIds: input.attachmentIds } : {}),
        ...(input.stagedAttachments?.length
          ? { attachments: input.stagedAttachments }
          : {}),
      }),
    },
  )

  const threadQueryKey = adminQueryKeys.requests.detail(input.progressRequestId)
  await queryClient.cancelQueries({ queryKey: threadQueryKey })

  if (result.thread) {
    queryClient.setQueryData(threadQueryKey, result.thread)
  } else if (result.sentMessage) {
    appendRequestMessageToCacheOrInvalidate(queryClient, input.progressRequestId, result.sentMessage)
  }

  void queryClient.invalidateQueries({
    queryKey: adminQueryKeys.projects.workspace(input.organizationId, input.projectId),
  })

  return result
}
