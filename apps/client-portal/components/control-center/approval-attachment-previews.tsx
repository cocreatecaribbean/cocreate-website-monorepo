'use client'

import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import { RequestAttachments, type ThreadAttachment } from '@/lib/projects/thread-content'

type ApprovalAttachmentPreviewsProps = {
  attachments: ThreadAttachment[]
  compact?: boolean
}

export default function ApprovalAttachmentPreviews({
  attachments,
  compact = false,
}: ApprovalAttachmentPreviewsProps) {
  if (!attachments.length) return null

  return (
    <RequestAttachments
      attachments={attachments}
      fetchDownloadUrl={fetchAttachmentDownloadUrl}
      showHeading={false}
      compact={compact}
      className={compact ? 'mt-2' : 'mt-3'}
    />
  )
}
