'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ApprovalCommentMessageList from '@cocreate/app-ui/approval-comment-message-list'
import { useCommentListAutoScroll } from '@cocreate/app-ui/use-comment-list-auto-scroll'
import EmojiPickerButton from '@/components/emoji-picker-button'
import ApprovalAttachmentPreviews from '@/components/approval-attachment-previews'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { submitApprovalRevision } from '@/lib/projects/submit-approval-revision'
import { bricolage_grot600 } from '@/styles/fonts'
import { CheckCircle2, FileText, Image as ImageIcon, MessageSquare, Play, Upload } from 'lucide-react'

function attachmentTypeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.startsWith('video/')) return Play
  return FileText
}

type ApprovalItem = {
  id: string
  title: string
  fileName: string
  attachmentId: string
  mimeType: string
  status: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES'
  revisionNumber: number
  note: string | null
  sentAt: string
}

type ApprovalComment = {
  id: string
  authorRole: 'ADMIN' | 'CLIENT' | 'COLLABORATOR'
  authorDisplayName: string
  body: string
  createdAt: string
}

type AdminProjectApprovalsPanelProps = {
  projectId: string
}

export default function AdminProjectApprovalsPanel({
  projectId,
}: AdminProjectApprovalsPanelProps) {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'NEEDS_CHANGES' | 'APPROVED'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comments, setComments] = useState<ApprovalComment[]>([])
  const [reply, setReply] = useState('')
  const [revisionFile, setRevisionFile] = useState<File | null>(null)
  const [revisionNote, setRevisionNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { listRef, endRef, scrollToBottomOnSend } = useCommentListAutoScroll(comments, selectedId ?? '', {
    smoothOnSend: true,
  })

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`
      const data = await fetchAdminBff<{ items: ApprovalItem[] }>(
        `/api/projects/${projectId}/approvals${query}`,
      )
      setItems(data.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load approvals')
    } finally {
      setLoading(false)
    }
  }, [filter, projectId])

  const loadComments = useCallback(async (itemId: string) => {
    try {
      const data = await fetchAdminBff<{ comments: ApprovalComment[] }>(
        `/api/approvals/${itemId}/comments`,
      )
      setComments(data.comments ?? [])
    } catch {
      setComments([])
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!selectedId) {
      setComments([])
      return
    }
    void loadComments(selectedId)
  }, [loadComments, selectedId])

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const onSendComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedId || !reply.trim()) return
    const body = reply.trim()
    setBusy(true)
    setError(null)
    setReply('')
    scrollToBottomOnSend()
    try {
      await fetchAdminBff(`/api/approvals/${selectedId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      await loadComments(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reply')
      setReply(body)
    } finally {
      setBusy(false)
    }
  }

  const onUploadRevision = async () => {
    if (!selectedId || !revisionFile) return
    setBusy(true)
    setError(null)
    try {
      const result = await submitApprovalRevision(
        projectId,
        selectedId,
        revisionFile,
        revisionNote.trim() || undefined,
      )
      if (!result.ok) {
        setError(result.message)
        return
      }
      setRevisionFile(null)
      setRevisionNote('')
      await loadItems()
      await loadComments(selectedId)
      scrollToBottomOnSend()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload revision')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'PENDING', 'NEEDS_CHANGES', 'APPROVED'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === value
                ? 'bg-chambray text-white'
                : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
            }`}
          >
            {value === 'all' ? 'All' : value.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-app-muted">Loading approvals…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-app-muted">No approval items yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
          <ul className="divide-y divide-chambray/8 rounded-xl border border-chambray/10 bg-white/60">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${
                    selectedId === item.id ? 'bg-sanmarino/10' : 'hover:bg-chambray/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sanmarino/10 text-sanmarino">
                      {(() => {
                        const Icon = attachmentTypeIcon(item.mimeType)
                        return <Icon className="h-4 w-4" aria-hidden />
                      })()}
                    </div>
                    <span className={`min-w-0 flex-1 text-sm text-chambray ${bricolage_grot600.className}`}>
                      {item.fileName}
                    </span>
                  </div>
                  <span className="text-xs text-app-muted">
                    {item.status.replace(/_/g, ' ')}
                    {item.revisionNumber > 1 ? ` · v${item.revisionNumber}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <section className="space-y-4 rounded-xl border border-chambray/10 bg-white/60 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-casablanca/20 p-2 text-chambray">
                  {selected.status === 'APPROVED' ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : (
                    <MessageSquare className="h-5 w-5" aria-hidden />
                  )}
                </div>
                <div>
                  <p className={`text-lg text-chambray ${bricolage_grot600.className}`}>
                    {selected.fileName}
                  </p>
                  <p className="text-sm text-app-muted">{selected.title}</p>
                  <p className="text-xs text-app-muted">
                    {selected.status.replace(/_/g, ' ')} · sent{' '}
                    {new Date(selected.sentAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selected.note ? (
                <p className="text-sm text-app-muted">{selected.note}</p>
              ) : null}

              <ApprovalAttachmentPreviews
                attachments={[
                  {
                    id: selected.attachmentId,
                    fileName: selected.fileName,
                    mimeType: selected.mimeType,
                  },
                ]}
              />

              <div className="space-y-2 border-t border-chambray/10 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
                  Client feedback
                </p>
                {comments.length === 0 ? (
                  <p className="text-sm text-app-muted">No comments yet.</p>
                ) : (
                  <ApprovalCommentMessageList
                    comments={comments}
                    viewerRole="ADMIN"
                    variant="admin"
                    density="comfortable"
                    listRef={listRef}
                    endRef={endRef}
                    listClassName="max-h-48 space-y-2"
                  />
                )}
              </div>

              <form onSubmit={(e) => void onSendComment(e)} className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Reply on this file…"
                  className="w-full rounded-lg border border-chambray/15 px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <EmojiPickerButton
                    variant="admin"
                    disabled={busy}
                    onSelect={(emoji) =>
                      insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
                    }
                  />
                  <button
                    type="submit"
                    disabled={busy || !reply.trim()}
                    className="rounded-lg bg-chambray/10 px-3 py-1.5 text-sm text-chambray"
                  >
                    Send reply
                  </button>
                </div>
              </form>

              {selected.status === 'NEEDS_CHANGES' ? (
                <div className="space-y-2 border-t border-chambray/10 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
                    Upload revision
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm"
                  />
                  <textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note for the client…"
                    className="w-full rounded-lg border border-chambray/15 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy || !revisionFile}
                    onClick={() => void onUploadRevision()}
                    className="inline-flex items-center gap-2 rounded-lg bg-chambray px-3 py-2 text-sm text-white"
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    {busy ? 'Uploading…' : 'Send revised file'}
                  </button>
                </div>
              ) : null}
            </section>
          ) : (
            <p className="text-sm text-app-muted">Select a file to view feedback and upload revisions.</p>
          )}
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}