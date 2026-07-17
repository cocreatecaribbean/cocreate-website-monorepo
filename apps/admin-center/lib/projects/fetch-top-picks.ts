import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type {
  FileReactionsResponse,
  ProjectAttachmentWithReactions,
  ProjectFileReactionKind,
  TopPicksResponse,
} from '@/lib/projects/types'

export async function fetchProjectTopPicks(
  projectId: string,
  tags?: string[],
): Promise<TopPicksResponse> {
  const params = new URLSearchParams()
  if (tags?.length) params.set('tags', tags.join(','))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return fetchAdminBff<TopPicksResponse>(
    `/api/projects/${projectId}/top-picks${suffix}`,
  )
}

export async function fetchProjectFileReactions(
  projectId: string,
): Promise<FileReactionsResponse> {
  return fetchAdminBff<FileReactionsResponse>(
    `/api/projects/${projectId}/file-reactions`,
  )
}

export async function setAttachmentReaction(
  attachmentId: string,
  kind: ProjectFileReactionKind,
): Promise<ProjectAttachmentWithReactions | null> {
  try {
    return await fetchAdminBff<ProjectAttachmentWithReactions>(
      `/api/attachments/${attachmentId}/reaction`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      },
    )
  } catch {
    return null
  }
}

export async function clearAttachmentReaction(
  attachmentId: string,
): Promise<ProjectAttachmentWithReactions | null> {
  try {
    return await fetchAdminBff<ProjectAttachmentWithReactions>(
      `/api/attachments/${attachmentId}/reaction`,
      { method: 'DELETE' },
    )
  } catch {
    return null
  }
}
