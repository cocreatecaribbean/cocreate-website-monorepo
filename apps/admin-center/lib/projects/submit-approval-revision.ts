import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { stageProjectFiles } from '@/lib/projects/fetch-project-files'
import type { ApprovalCommentItem } from '@/lib/projects/thread-approval-items'

type SerializedApprovalItem = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES'
  revisionNumber: number
  attachmentId: string
  fileName: string
  mimeType: string
  createdAt: string
}

export async function submitApprovalRevision(
  projectId: string,
  approvalItemId: string,
  file: File,
  note?: string,
): Promise<
  | { ok: true; item: SerializedApprovalItem; comment: ApprovalCommentItem }
  | { ok: false; message: string }
> {
  try {
    const staged = await stageProjectFiles(projectId, [file])
    const attachment = staged[0]
    if (!attachment) {
      return { ok: false, message: 'Could not stage revision file' }
    }

    const data = await fetchAdminBff<{
      item: SerializedApprovalItem
      comment: ApprovalCommentItem
    }>(`/api/approvals/${approvalItemId}/revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachment,
        ...(note?.trim() ? { note: note.trim() } : {}),
      }),
    })

    return { ok: true, item: data.item, comment: data.comment }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not upload revision',
    }
  }
}
