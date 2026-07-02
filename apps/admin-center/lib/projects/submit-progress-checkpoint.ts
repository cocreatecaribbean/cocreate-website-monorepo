import type { QueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestItem } from '@/lib/projects/types'
import type { StagedProjectFile } from '@/lib/projects/fetch-project-files'

export type SubmitProgressCheckpointInput = {
  organizationId: string
  projectId: string
  progressRequestId: string
  title: string
  body: string
  attachmentIds?: string[]
  stagedAttachments?: StagedProjectFile[]
  reviewUrl?: string
  targetPhase?: string
}

export async function submitProgressCheckpoint(
  queryClient: QueryClient,
  input: SubmitProgressCheckpointInput,
): Promise<ProjectRequestItem> {
  const title = input.title.trim()
  const body = input.body.trim()
  const reviewUrl = input.reviewUrl?.trim()

  const result = await fetchAdminBff<ProjectRequestItem>(
    `/api/projects/${input.projectId}/checkpoints`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        ...(reviewUrl ? { reviewUrl } : {}),
        ...(input.targetPhase ? { targetPhase: input.targetPhase } : {}),
        ...(input.attachmentIds?.length ? { attachmentIds: input.attachmentIds } : {}),
        ...(input.stagedAttachments?.length
          ? { attachments: input.stagedAttachments }
          : {}),
      }),
    },
  )

  queryClient.setQueryData(
    adminQueryKeys.requests.detail(input.progressRequestId),
    result,
  )
  void queryClient.invalidateQueries({
    queryKey: adminQueryKeys.projects.workspace(input.organizationId, input.projectId),
  })

  return result
}
