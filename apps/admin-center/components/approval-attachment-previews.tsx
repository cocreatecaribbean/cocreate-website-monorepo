'use client'

import { AttachmentPreviews } from '@cocreate/app-ui/attachment-previews'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import type { ThreadAttachment } from '@/lib/projects/thread-content'

type ApprovalAttachmentPreviewsProps = {
  attachments: ThreadAttachment[]
  compact?: boolean
}

export default function ApprovalAttachmentPreviews({
  attachments,
  compact = false,
}: ApprovalAttachmentPreviewsProps) {
  return (
    <AttachmentPreviews
      attachments={attachments}
      fetchDownloadUrl={fetchAttachmentDownloadUrl}
      variant="admin"
      showHeading={false}
      compact={compact}
      className={compact ? 'mt-2' : 'mt-3'}
    />
  )
}
