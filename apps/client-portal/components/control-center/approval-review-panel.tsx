'use client'

import { FormEvent, useRef, useState } from 'react'
import Link from 'next/link'
import ApprovalCommentMessageList from '@cocreate/app-ui/approval-comment-message-list'
import { useCommentListAutoScroll } from '@cocreate/app-ui/use-comment-list-auto-scroll'
import EmojiPickerButton from '@/components/emoji-picker-button'
import ApprovalAttachmentPreviews from '@/components/control-center/approval-attachment-previews'
import { useApprovalCommentsQuery, useSendApprovalCommentMutation } from '@/lib/api/mutations/approvals'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import { PROJECT_ID_QUERY, PROJECT_TAB_QUERY } from '@/lib/control-center/project-workspace'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import type { PendingApprovalFile } from '@/lib/projects/pending-approval-files'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import { bricolage_grot600 } from '@/styles/fonts'
import { CheckCircle2, ExternalLink, MessageSquare } from 'lucide-react'

type ApprovalReviewPanelProps = {
  file: PendingApprovalFile
  onApprove: (approvalItemId: string) => Promise<{ ok: boolean; message?: string }>
  onNeedsChanges: (
    approvalItemId: string,
    body?: string,
  ) => Promise<{ ok: boolean; message?: string }>
}

export default function ApprovalReviewPanel({
  file,
  onApprove,
  onNeedsChanges,
}: ApprovalReviewPanelProps) {
  const [feedback, setFeedback] = useState('')
  const [showThread, setShowThread] = useState(false)
  const [approving, setApproving] = useState(false)
  const [requestingChanges, setRequestingChanges] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isNeedsChanges = file.status === 'NEEDS_CHANGES'
  const threadOpen = showThread || isNeedsChanges

  const { data: comments = [], isLoading: commentsLoading } = useApprovalCommentsQuery(
    threadOpen ? file.approvalItemId : null,
  )
  const sendComment = useSendApprovalCommentMutation(file.approvalItemId)
  const { listRef, endRef, scrollToBottomOnSend } = useCommentListAutoScroll(
    comments,
    file.approvalItemId,
    { smoothOnSend: true },
  )

  const progressHref = `/?${CONTROL_CENTER_VIEW_QUERY}=projects&${PROJECT_ID_QUERY}=${encodeURIComponent(file.projectId)}&${PROJECT_TAB_QUERY}=progress`
  const bodyPreview = file.checkpointBody.trim() || file.checkpointTitle

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
      setShowThread(true)
    } else {
      setError(result.message ?? 'Could not submit feedback')
      if (body) setFeedback(body)
    }
    setRequestingChanges(false)
  }

  const onSubmitComment = async (e: FormEvent) => {
    e.preventDefault()
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
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-casablanca/20 text-chambray">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-lg text-chambray ${bricolage_grot600.className}`}>
            {file.attachment?.fileName ?? file.checkpointTitle}
          </p>
          {file.projectTitle ? (
            <p className="text-sm text-sanmarino">{file.projectTitle}</p>
          ) : null}
          {file.revisionNumber > 1 ? (
            <p className="text-xs text-app-muted">Revision {file.revisionNumber}</p>
          ) : null}
          {isNeedsChanges ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-chambray">
              Changes requested
            </p>
          ) : null}
        </div>
        <Link
          href={progressHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs text-sanmarino hover:text-chambray"
        >
          View project
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {bodyPreview ? (
        <p className="text-sm leading-relaxed text-app-muted">{bodyPreview}</p>
      ) : null}

      {file.attachment ? (
        <ApprovalAttachmentPreviews attachments={[file.attachment]} />
      ) : (
        <p className="text-sm text-app-muted">No file preview available.</p>
      )}

      {!isNeedsChanges ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={approving || requestingChanges}
            onClick={() => void onApproveClick()}
            className="portal-btn-primary text-sm"
          >
            {approving ? 'Approving…' : 'Approved'}
          </button>
          <button
            type="button"
            disabled={approving || requestingChanges}
            onClick={() => {
              setShowThread(true)
              if (feedback.trim()) {
                void onNeedsChangesClick()
              }
            }}
            className="portal-btn-ghost text-sm"
          >
            Needs changes
          </button>
        </div>
      ) : null}

      {threadOpen ? (
        <div className="space-y-3 border-t border-chambray/10 pt-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-app-muted">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Feedback on this file
          </div>
          {commentsLoading ? (
            <p className="text-sm text-app-muted">Loading conversation…</p>
          ) : comments.length > 0 ? (
            <ApprovalCommentMessageList
              comments={comments}
              viewerRole="CLIENT"
              variant="portal"
              density="comfortable"
              showTimestamp
              listRef={listRef}
              endRef={endRef}
            />
          ) : (
            <p className="text-sm text-app-muted">
              Describe what needs to change — CoCreate will reply here when a revision is ready.
            </p>
          )}

          <form onSubmit={(e) => void onSubmitComment(e)} className="space-y-2">
            <textarea
              ref={textareaRef}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what to change on this file…"
              rows={3}
              className="portal-textarea w-full resize-y"
            />
            <div className="flex flex-wrap gap-2">
              <EmojiPickerButton
                variant="portal"
                disabled={sending || requestingChanges}
                onSelect={(emoji) =>
                  insertAtTextareaCursor(textareaRef.current, emoji, feedback, setFeedback)
                }
              />
              <button
                type="submit"
                disabled={!canSendThreadMessage(feedback, [], [], sending)}
                className="portal-btn-ghost text-sm"
              >
                {sending ? 'Sending…' : 'Send feedback'}
              </button>
              {!isNeedsChanges ? (
                <button
                  type="button"
                  disabled={requestingChanges || !feedback.trim()}
                  onClick={() => void onNeedsChangesClick()}
                  className="portal-btn-primary text-sm"
                >
                  {requestingChanges ? 'Submitting…' : 'Submit needs changes'}
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {error ? <p className="portal-alert-error">{error}</p> : null}
    </div>
  )
}
