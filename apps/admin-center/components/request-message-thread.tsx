'use client'

import { FormEvent, useCallback, useRef, useState } from 'react'
import EmojiPickerButton from '@/components/emoji-picker-button'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import { useRequestThreadRealtime } from '@/lib/projects/use-request-thread-realtime'
import { bricolage_grot600 } from '@/styles/fonts'

type RequestMessageThreadProps = {
  request: ProjectRequestItem
  viewerRole: 'ADMIN' | 'CLIENT'
  currentUserId?: string | null
  libraryVisibility?: 'CLIENT' | 'INTERNAL'
  uploadVisibility?: 'CLIENT' | 'INTERNAL'
  readOnly?: boolean
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string }>
  onResolve?: (status: 'RESOLVED' | 'REJECTED') => Promise<void>
  showResolveActions?: boolean
  onThreadUpdate?: () => void
}

function initialAuthorRole(request: ProjectRequestItem): 'ADMIN' | 'CLIENT' {
  if (request.type === 'ONBOARDING') return 'CLIENT'
  if (request.type === 'CANCELLATION') return 'CLIENT'
  return 'ADMIN'
}

function messageIsMine(
  msg: ProjectRequestMessage,
  viewerRole: 'ADMIN' | 'CLIENT',
  currentUserId?: string | null,
): boolean {
  if (viewerRole === 'CLIENT') {
    return msg.authorRole === 'CLIENT'
  }
  if (currentUserId && msg.authorUserId) {
    return msg.authorUserId === currentUserId
  }
  return msg.authorRole === 'ADMIN'
}

function messageAuthorLabel(msg: ProjectRequestMessage, isMine: boolean): string {
  if (isMine) return 'You'
  if (msg.authorRole === 'ADMIN' || msg.authorRole === 'COLLABORATOR') {
    return (
      formatActorWithTitle(msg.authorDisplayName, msg.authorJobTitle, msg.authorEmail) ??
      msg.authorEmail ??
      (msg.authorRole === 'COLLABORATOR' ? 'Collaborator' : 'CoCreate team')
    )
  }
  return formatActorWithTitle(msg.authorDisplayName, null, msg.authorEmail) ?? 'Client'
}

export default function RequestMessageThread({
  request,
  viewerRole,
  currentUserId,
  libraryVisibility,
  uploadVisibility,
  onSendMessage,
  onResolve,
  showResolveActions = false,
  readOnly = false,
  onThreadUpdate,
}: RequestMessageThreadProps) {
  useRequestThreadRealtime(request.id, () => onThreadUpdate?.(), {
    enabled: Boolean(onThreadUpdate),
  })

  const [reply, setReply] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
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
      uploadVisibility ? { visibility: uploadVisibility } : undefined,
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

  return (
    <div className="space-y-4">
      <div ref={panelRef} className="admin-thread-panel">
        {messages.length === 0 ? (
          <p className="text-sm text-app-muted">No messages yet.</p>
        ) : (
          messages.map((msg, messageIndex) => {
            const messageAttachments = attachmentsByMessage.get(messageIndex)
            const isMine = messageIsMine(msg, viewerRole, currentUserId)
            const authorLabel = messageAuthorLabel(msg, isMine)
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <p className="text-[0.65rem] font-medium text-app-muted">
                  {authorLabel}
                  {msg.authorEmail &&
                  !isMine &&
                  msg.authorDisplayName !== msg.authorEmail &&
                  !authorLabel.includes(msg.authorEmail)
                    ? ` (${msg.authorEmail})`
                    : ''}{' '}
                  · {new Date(msg.createdAt).toLocaleString()}
                </p>
                <div
                  className={`mt-1 max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    isMine ? 'admin-msg-mine' : 'admin-msg-theirs'
                  } ${bricolage_grot600.className}`}
                >
                  {msg.messageKind === 'CHECKPOINT' ? (
                    <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-sanmarino">
                      Progress check
                    </span>
                  ) : null}
                  <LinkifiedBody body={msg.body} />
                  {msg.supersededAt ? (
                    <span className="mt-2 block text-xs text-app-muted italic">
                      Superseded by a newer review
                    </span>
                  ) : null}
                  {msg.clientApprovedAt ? (
                    <span className="admin-info-text mt-2 block text-xs">
                      Client approved {new Date(msg.clientApprovedAt).toLocaleString()}
                    </span>
                  ) : null}
                  {msg.isPendingApproval ? (
                    <span className="mt-2 block text-xs text-amber-800">
                      Awaiting client approval
                    </span>
                  ) : null}
                </div>
                {messageAttachments?.length ? (
                  <RequestAttachments
                    attachments={messageAttachments}
                    fetchDownloadUrl={fetchDownloadUrl}
                    variant="admin"
                    showHeading={false}
                    className={`mt-2 max-w-[90%] ${isMine ? 'self-end' : 'self-start'}`}
                  />
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
                  : request.type === 'INTERNAL'
                    ? 'Message the team…'
                    : 'Follow up with the client…'
              }
              rows={3}
              className="admin-textarea w-full resize-y"
            />
          </div>
          <MessageAttachmentComposer
            projectId={request.projectId}
            disabled={sending}
            libraryVisibility={libraryVisibility}
            selectedIds={selectedAttachmentIds}
            pendingFiles={pendingFiles}
            onSelectedIdsChange={setSelectedAttachmentIds}
            onPendingFilesChange={setPendingFiles}
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <EmojiPickerButton
              variant="admin"
              disabled={sending}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
              }
            />
            <button type="submit" disabled={sending} className="admin-btn-primary text-sm">
              {sending ? 'Sending…' : 'Send message'}
            </button>
            {showResolveActions && onResolve ? (
              <>
                <button
                  type="button"
                  onClick={() => void onResolve('RESOLVED')}
                  className="admin-btn-ghost text-sm"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={() => void onResolve('REJECTED')}
                  className="admin-btn-ghost text-sm"
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
        <p className="text-sm text-app-muted">Archived (read only).</p>
      ) : null}
    </div>
  )
}
