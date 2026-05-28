'use client'

import { FormEvent, useCallback, useRef, useState } from 'react'
import EmojiPickerButton from '@/components/emoji-picker-button'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/api-types'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import { useRequestThreadRealtime } from '@/lib/projects/use-request-thread-realtime'
import { bricolage_grot600 } from '@/styles/fonts'

type RequestMessageThreadProps = {
  request: ProjectRequestItem
  viewerRole: 'ADMIN' | 'CLIENT'
  variant?: 'portal' | 'admin'
  readOnly?: boolean
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string }>
  onApproveCheckpoint?: (messageId: string) => Promise<{ ok: boolean; message?: string }>
  onResolve?: (status: 'RESOLVED' | 'REJECTED') => Promise<void>
  showResolveActions?: boolean
  onThreadUpdate?: () => void
}

function initialAuthorRole(request: ProjectRequestItem): 'ADMIN' | 'CLIENT' {
  if (request.type === 'ONBOARDING') return 'CLIENT'
  if (request.type === 'CANCELLATION') return 'CLIENT'
  return 'ADMIN'
}

export default function RequestMessageThread({
  request,
  viewerRole,
  onSendMessage,
  onApproveCheckpoint,
  onResolve,
  showResolveActions = false,
  readOnly = false,
  variant = 'portal',
  onThreadUpdate,
}: RequestMessageThreadProps) {
  useRequestThreadRealtime(request.id, () => onThreadUpdate?.(), {
    enabled: Boolean(onThreadUpdate),
  })

  const inputClass =
    variant === 'admin' ? 'admin-textarea w-full resize-y' : 'portal-textarea w-full resize-y'
  const btnPrimary = variant === 'admin' ? 'admin-btn-primary text-sm' : 'portal-btn-primary text-sm'
  const btnGhost = variant === 'admin' ? 'admin-btn-ghost text-sm' : 'portal-btn-ghost text-sm'
  const [reply, setReply] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const messages: ProjectRequestMessage[] =
    request.messages && request.messages.length > 0
      ? request.messages
      : request.description
        ? [
            {
              id: 'initial',
              requestId: request.id,
              authorUserId: '',
              authorEmail: null,
              authorRole: initialAuthorRole(request),
              body: request.description,
              createdAt: request.createdAt,
            },
          ]
        : []

  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(request.status)
  const canCompose = !readOnly && !isClosed
  const attachmentsByMessage = indexAttachmentsByMessage(messages, request.attachments)
  const { panelRef, scrollToBottom } = useThreadAutoScroll(messages, request.id)
  const fetchDownloadUrl = useCallback(
    (attachmentId: string) => fetchAttachmentDownloadUrl(attachmentId),
    [],
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setError(null)
    const uploaded = await resolvePendingMessageAttachments(
      request.projectId,
      pendingFiles,
    )
    if (!uploaded.ok) {
      setError(uploaded.message ?? 'Could not upload attachments')
      setSending(false)
      return
    }

    const attachmentIds = [
      ...new Set([...selectedAttachmentIds, ...uploaded.attachmentIds]),
    ]
    const result = await onSendMessage(reply.trim(), attachmentIds)
    if (!result.ok) {
      setError(result.message ?? 'Could not send message')
    } else {
      setReply('')
      setSelectedAttachmentIds([])
      setPendingFiles([])
      scrollToBottom(true)
    }
    setSending(false)
  }

  const onApprove = async (messageId: string) => {
    if (!onApproveCheckpoint) return
    setApprovingId(messageId)
    setError(null)
    const result = await onApproveCheckpoint(messageId)
    if (!result.ok) setError(result.message ?? 'Could not approve')
    setApprovingId(null)
  }

  return (
    <div className="space-y-4">
      <div ref={panelRef} className="portal-thread-panel">
        {messages.length === 0 ? (
          <p className="text-sm text-app-muted">No messages yet.</p>
        ) : (
          messages.map((msg, messageIndex) => {
            const messageAttachments = attachmentsByMessage.get(messageIndex)
            const isMine =
              (viewerRole === 'ADMIN' && msg.authorRole === 'ADMIN') ||
              (viewerRole === 'CLIENT' && msg.authorRole === 'CLIENT')
            const showApprove =
              viewerRole === 'CLIENT' &&
              msg.isPendingApproval &&
              onApproveCheckpoint &&
              !readOnly

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <p className="text-[0.65rem] font-medium text-app-muted">
                  {isMine
                    ? 'You'
                    : msg.authorRole === 'ADMIN'
                      ? formatActorWithTitle(
                          msg.authorDisplayName,
                          msg.authorJobTitle,
                          msg.authorEmail,
                        ) ?? 'CoCreate team'
                      : formatActorWithTitle(
                          msg.authorDisplayName,
                          null,
                          msg.authorEmail,
                        ) ?? 'Client'}
                  {msg.authorEmail &&
                  !isMine &&
                  msg.authorDisplayName !== msg.authorEmail
                    ? ` (${msg.authorEmail})`
                    : ''}{' '}
                  · {new Date(msg.createdAt).toLocaleString()}
                </p>
                <div
                  className={`mt-1 max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    isMine ? 'portal-msg-mine' : 'portal-msg-theirs'
                  } ${bricolage_grot600.className}`}
                >
                  {msg.messageKind === 'CHECKPOINT' ? (
                    <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-sanmarino">
                      Progress check
                    </p>
                  ) : null}
                  <LinkifiedBody body={msg.body} />
                  {msg.supersededAt ? (
                    <p className="mt-2 text-xs text-app-muted italic">
                      Superseded by a newer review from CoCreate
                    </p>
                  ) : null}
                  {msg.clientApprovedAt ? (
                    <p className="portal-info-text mt-2 text-xs">
                      Approved {new Date(msg.clientApprovedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                {messageAttachments?.length ? (
                  <RequestAttachments
                    attachments={messageAttachments}
                    fetchDownloadUrl={fetchDownloadUrl}
                    variant="portal"
                    showHeading={false}
                    className={`mt-2 max-w-[90%] ${isMine ? 'self-end' : 'self-start'}`}
                  />
                ) : null}
                {showApprove ? (
                  <button
                    type="button"
                    disabled={approvingId === msg.id}
                    onClick={() => void onApprove(msg.id)}
                    className={`${btnPrimary} mt-2`}
                  >
                    {approvingId === msg.id ? 'Approving…' : 'Approve'}
                  </button>
                ) : null}
              </div>
            )
          })
        )}
      </div>

      {canCompose ? (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                viewerRole === 'CLIENT'
                  ? 'Write your response to CoCreate…'
                  : 'Follow up with the client…'
              }
              rows={3}
              className={inputClass}
            />
          </div>
          <MessageAttachmentComposer
            projectId={request.projectId}
            variant={variant === 'admin' ? 'admin' : 'portal'}
            disabled={sending}
            selectedIds={selectedAttachmentIds}
            pendingFiles={pendingFiles}
            onSelectedIdsChange={setSelectedAttachmentIds}
            onPendingFilesChange={setPendingFiles}
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <EmojiPickerButton
              variant={variant === 'admin' ? 'admin' : 'portal'}
              disabled={sending}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
              }
            />
            <button type="submit" disabled={sending} className={btnPrimary}>
              {sending ? 'Sending…' : 'Send message'}
            </button>
            {showResolveActions && onResolve ? (
              <>
                <button
                  type="button"
                  onClick={() => void onResolve('RESOLVED')}
                  className={btnGhost}
                >
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={() => void onResolve('REJECTED')}
                  className={btnGhost}
                >
                  Reject
                </button>
              </>
            ) : null}
          </div>
        </form>
      ) : isClosed ? (
        <p className="text-sm text-app-muted">This conversation is closed ({request.status}).</p>
      ) : readOnly ? (
        <p className="text-sm text-app-muted">Archived conversation (read only).</p>
      ) : null}
    </div>
  )
}
