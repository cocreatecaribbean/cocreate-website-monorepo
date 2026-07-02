'use client'

import { FormEvent, useRef, useState } from 'react'
import ApprovalCommentMessageList from '@cocreate/app-ui/approval-comment-message-list'
import { useCommentListAutoScroll } from '@cocreate/app-ui/use-comment-list-auto-scroll'
import EmojiPickerButton from '@/components/emoji-picker-button'
import ApprovalAttachmentPreviews from '@/components/approval-attachment-previews'
import type { ThreadApprovalItem } from '@/lib/projects/thread-approval-items'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { bricolage_grot600 } from '@/styles/fonts'
import { Upload } from 'lucide-react'

type AdminThreadApprovalCardProps = {
  item: ThreadApprovalItem
  onReply: (approvalItemId: string, body: string) => Promise<{ ok: boolean; message?: string }>
  onUploadRevision?: (
    approvalItemId: string,
    file: File,
    note?: string,
  ) => Promise<{ ok: boolean; message?: string }>
}

function statusLabel(status: ThreadApprovalItem['status']) {
  if (status === 'PENDING') return 'Awaiting review'
  if (status === 'NEEDS_CHANGES') return 'Needs changes'
  return 'Approved'
}

function statusClass(status: ThreadApprovalItem['status']) {
  if (status === 'PENDING') return 'bg-amber-100 text-amber-900'
  if (status === 'NEEDS_CHANGES') return 'bg-red-100 text-red-900'
  return 'bg-emerald-100 text-emerald-900'
}

export default function AdminThreadApprovalCard({
  item,
  onReply,
  onUploadRevision,
}: AdminThreadApprovalCardProps) {
  const [reply, setReply] = useState('')
  const [revisionNote, setRevisionNote] = useState('')
  const [revisionFile, setRevisionFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canReply = item.status === 'PENDING' || item.status === 'NEEDS_CHANGES'

  const { listRef, endRef, scrollToBottomOnSend } = useCommentListAutoScroll(item.comments, item.id, {
    smoothOnSend: true,
  })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!reply.trim() || sending) return
    const body = reply.trim()
    setSending(true)
    setError(null)
    setReply('')
    scrollToBottomOnSend()
    const result = await onReply(item.id, body)
    if (!result.ok) {
      setError(result.message ?? 'Could not send reply')
      setReply(body)
    }
    setSending(false)
  }

  const onUpload = async () => {
    if (!onUploadRevision || !revisionFile || uploading) return
    setUploading(true)
    setError(null)
    const note = revisionNote.trim() || undefined
    scrollToBottomOnSend()
    const result = await onUploadRevision(item.id, revisionFile, note)
    if (result.ok) {
      setRevisionFile(null)
      setRevisionNote('')
    } else {
      setError(result.message ?? 'Could not upload revision')
    }
    setUploading(false)
  }

  return (
    <div className="admin-glass-card mt-2 max-w-[90%] space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
          {item.attachment?.fileName ?? item.title}
          {item.revisionNumber > 1 ? ` · v${item.revisionNumber}` : ''}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${statusClass(item.status)}`}
        >
          {statusLabel(item.status)}
        </span>
      </div>

      {item.attachment ? (
        <ApprovalAttachmentPreviews attachments={[item.attachment]} compact />
      ) : null}

      {item.comments.length > 0 ? (
        <ApprovalCommentMessageList
          comments={item.comments}
          viewerRole="ADMIN"
          variant="admin"
          density="comfortable"
          showTimestamp
          listRef={listRef}
          endRef={endRef}
          listClassName="max-h-48 space-y-2"
        />
      ) : item.status === 'PENDING' ? (
        <p className="text-xs text-app-muted">Waiting for client review.</p>
      ) : null}

      {canReply ? (
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={2}
            placeholder="Reply on this file…"
            className="admin-textarea w-full resize-y text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <EmojiPickerButton
              variant="admin"
              disabled={sending || uploading}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
              }
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="admin-btn-ghost text-xs"
            >
              {sending ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </form>
      ) : item.status === 'APPROVED' ? (
        <p className="admin-info-text text-xs">Client approved this file.</p>
      ) : null}

      {item.status === 'NEEDS_CHANGES' && onUploadRevision ? (
        <div className="space-y-2 border-t border-chambray/10 pt-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-app-muted">
            Upload revision
          </p>
          <input
            type="file"
            onChange={(event) => setRevisionFile(event.target.files?.[0] ?? null)}
            className="block w-full text-xs"
          />
          <textarea
            value={revisionNote}
            onChange={(event) => setRevisionNote(event.target.value)}
            rows={2}
            placeholder="Optional note for the client…"
            className="admin-textarea w-full resize-y text-sm"
          />
          <button
            type="button"
            disabled={uploading || !revisionFile}
            onClick={() => void onUpload()}
            className="admin-btn-primary inline-flex items-center gap-2 text-xs"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {uploading ? 'Uploading…' : 'Send revised file'}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  )
}
