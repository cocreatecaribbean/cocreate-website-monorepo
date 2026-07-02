'use client'

import { FormEvent, useRef, useState } from 'react'
import ApprovalCommentMessageList from '@cocreate/app-ui/approval-comment-message-list'
import { useCommentListAutoScroll } from '@cocreate/app-ui/use-comment-list-auto-scroll'
import EmojiPickerButton from '@/components/emoji-picker-button'
import ApprovalAttachmentPreviews from '@/components/control-center/approval-attachment-previews'
import {
  useApprovalCommentsQuery,
  useSendApprovalCommentMutation,
} from '@/lib/api/mutations/approvals'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import type { PendingApprovalFile } from '@/lib/projects/pending-approval-files'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import { bricolage_grot600 } from '@/styles/fonts'

type ThreadApprovalCardProps = {
  file: PendingApprovalFile
  onApprove: (approvalItemId: string) => Promise<{ ok: boolean; message?: string }>
  onNeedsChanges: (
    approvalItemId: string,
    body?: string,
  ) => Promise<{ ok: boolean; message?: string }>
}

export default function ThreadApprovalCard({
  file,
  onApprove,
  onNeedsChanges,
}: ThreadApprovalCardProps) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [approving, setApproving] = useState(false)
  const [requestingChanges, setRequestingChanges] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isNeedsChanges = file.status === 'NEEDS_CHANGES'
  const threadOpen = showFeedback || isNeedsChanges

  const { data: comments = [], isLoading: commentsLoading } = useApprovalCommentsQuery(
    threadOpen ? file.approvalItemId : null,
  )
  const sendComment = useSendApprovalCommentMutation(file.approvalItemId)
  const { listRef, endRef, scrollToBottomOnSend } = useCommentListAutoScroll(
    comments,
    file.approvalItemId,
    { smoothOnSend: true },
  )

  const onApproveClick = async () => {
    setApproving(true)
    setError(null)
    const result = await onApprove(file.approvalItemId)
    if (!result.ok) setError(result.message ?? 'Could not approve')
    setApproving(false)
  }

  const onNeedsChangesClick = async () => {
    const body = feedback.trim() || undefined
    setRequestingChanges(true)
    setError(null)
    setFeedback('')
    scrollToBottomOnSend()
    const result = await onNeedsChanges(file.approvalItemId, body)
    if (result.ok) {
      setShowFeedback(true)
    } else {
      setError(result.message ?? 'Could not submit feedback')
      if (body) setFeedback(body)
    }
    setRequestingChanges(false)
  }

  const onSubmitFeedback = async (e: FormEvent) => {
    e.preventDefault()
    if (isNeedsChanges) {
      if (!canSendThreadMessage(feedback, [], [], sending)) return
      const body = feedback.trim()
      setSending(true)
      setError(null)
      setFeedback('')
      scrollToBottomOnSend()
      try {
        const result = await sendComment.mutateAsync(body)
        if (!result.ok) {
          setError(result.message ?? 'Could not send message')
          setFeedback(body)
        }
      } catch {
        setError('Could not send message')
        setFeedback(body)
      }
      setSending(false)
      return
    }
    if (!canSendThreadMessage(feedback, [], [], requestingChanges)) return
    await onNeedsChangesClick()
  }

  return (
    <div className="portal-glass-card mt-2 max-w-[90%] space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
          {file.attachment?.fileName ?? file.checkpointTitle}
          {file.revisionNumber > 1 ? ` · v${file.revisionNumber}` : ''}
        </p>
        {isNeedsChanges ? (
          <span className="rounded-full bg-casablanca/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-chambray">
            Changes requested
          </span>
        ) : null}
      </div>

      {file.attachment ? (
        <ApprovalAttachmentPreviews attachments={[file.attachment]} compact />
      ) : null}

      {!isNeedsChanges ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={approving || requestingChanges}
            onClick={() => void onApproveClick()}
            className="portal-btn-primary text-xs"
          >
            {approving ? 'Approving…' : 'Approved'}
          </button>
          <button
            type="button"
            disabled={approving || requestingChanges}
            onClick={() => setShowFeedback((open) => !open)}
            className="portal-btn-ghost text-xs"
          >
            Needs changes
          </button>
        </div>
      ) : null}

      {threadOpen ? (
        <form onSubmit={(e) => void onSubmitFeedback(e)} className="space-y-2">
          {commentsLoading ? (
            <p className="text-xs text-app-muted">Loading conversation…</p>
          ) : comments.length > 0 ? (
            <ApprovalCommentMessageList
              comments={comments}
              viewerRole="CLIENT"
              variant="portal"
              density="compact"
              listRef={listRef}
              endRef={endRef}
              className="text-app-muted"
            />
          ) : isNeedsChanges ? (
            <p className="text-xs text-app-muted">
              CoCreate will reply here when a revision is ready.
            </p>
          ) : null}
          <textarea
            ref={textareaRef}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              isNeedsChanges
                ? 'Add more feedback on this file…'
                : 'What should change on this file?'
            }
            rows={2}
            className="portal-textarea w-full resize-y text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <EmojiPickerButton
              variant="portal"
              disabled={sending || requestingChanges}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, feedback, setFeedback)
              }
            />
            <button
              type="submit"
              disabled={
                isNeedsChanges
                  ? !canSendThreadMessage(feedback, [], [], sending)
                  : requestingChanges || !feedback.trim()
              }
              className="portal-btn-ghost text-xs"
            >
              {isNeedsChanges
                ? sending
                  ? 'Sending…'
                  : 'Send feedback'
                : requestingChanges
                  ? 'Submitting…'
                  : 'Submit feedback'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="portal-alert-error text-xs">{error}</p> : null}
    </div>
  )
}
