'use client'

import { useCallback } from 'react'
import { AttachmentPreviews } from '@cocreate/app-ui/attachment-previews'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import type { ThreadAttachment } from '@/lib/projects/thread-content'

type ApprovalAttachmentPreviewsProps = {
  attachments: ThreadAttachment[]
  compact?: boolean
}

export default function ApprovalAttachmentPreviews({
  attachments,
  compact = false,
}: ApprovalAttachmentPreviewsProps) {
  const fetchDownloadUrl = useCallback(async (attachmentId: string) => {
    const result = await fetchAttachmentDownloadUrl(attachmentId)
    return result.url
  }, [])

  return (
    <AttachmentPreviews
      attachments={attachments}
      fetchDownloadUrl={fetchDownloadUrl}
      variant="portal"
      showHeading={false}
      compact={compact}
      className={compact ? 'mt-2' : 'mt-3'}
    />
  )
}
