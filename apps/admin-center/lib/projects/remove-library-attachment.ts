import type { QueryClient } from '@tanstack/react-query'

import { AdminApiFetchError, fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'

type RemoveLibraryAttachmentResponse = {
  ok: boolean
  message?: string
}

export async function removeLibraryAttachment(
  queryClient: QueryClient,
  input: {
    attachmentId: string
    organizationId?: string
    projectId?: string
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await fetchAdminBff<RemoveLibraryAttachmentResponse>(
      `/api/attachments/${input.attachmentId}`,
      { method: 'DELETE' },
    )
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof AdminApiFetchError
          ? error.message
          : 'Could not remove file',
    }
  }

  void queryClient.invalidateQueries({ queryKey: adminQueryKeys.files.all })

  if (input.organizationId && input.projectId) {
    void queryClient.invalidateQueries({
      queryKey: adminQueryKeys.projects.workspace(input.organizationId, input.projectId),
    })
  }

  return { ok: true }
}
