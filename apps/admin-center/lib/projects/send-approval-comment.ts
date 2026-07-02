import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type { ApprovalCommentItem } from '@/lib/projects/thread-approval-items'

export async function sendApprovalComment(
  approvalItemId: string,
  body: string,
): Promise<
  | { ok: true; comment: ApprovalCommentItem }
  | { ok: false; message: string }
> {
  try {
    const data = await fetchAdminBff<{ comment: ApprovalCommentItem }>(
      `/api/approvals/${approvalItemId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      },
    )
    return { ok: true, comment: data.comment }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not send reply',
    }
  }
}
