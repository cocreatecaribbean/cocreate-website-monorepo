'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import EmojiPickerButton from '@/components/emoji-picker-button'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useAdminRequestThreadQuery } from '@/lib/api/queries/projects'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import {
  createOptimisticRequestMessage,
  isPendingRequestMessage,
} from '@/lib/projects/optimistic-request-message'
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
  invalidateQueryKeys?: import('@tanstack/react-query').QueryKey[]
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
  invalidateQueryKeys,
}: RequestMessageThreadProps) {
  const needsThreadFetch = !request.messages?.length
  const { data: fetchedThread } = useAdminRequestThreadQuery(
    needsThreadFetch ? request.id : null,
  )
  const activeRequest = fetchedThread ?? request

  useEffect(() => {
    setOlderMessages([])
    setHasMoreOlder(
      (activeRequest.messageCount ?? activeRequest.messages?.length ?? 0) >= 50,
    )
  }, [activeRequest.id, activeRequest.messageCount, activeRequest.messages?.length])

  useRequestThreadRealtime(activeRequest.id, () => onThreadUpdate?.(), {
    enabled: Boolean(onThreadUpdate || invalidateQueryKeys?.length),
    invalidateQueryKeys,
  })

  const [reply, setReply] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingMessages, setPendingMessages] = useState<ProjectRequestMessage[]>([])
  const [olderMessages, setOlderMessages] = useState<ProjectRequestMessage[]>([])
  const [hasMoreOlder, setHasMoreOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseMessages: ProjectRequestMessage[] =
    activeRequest.messages && activeRequest.messages.length > 0
      ? activeRequest.messages
      : activeRequest.description
        ? [
            {
              id: 'initial',
              requestId: activeRequest.id,
              authorUserId: '',
              authorEmail: null,
              authorRole: initialAuthorRole(activeRequest),
              body: activeRequest.description,
              createdAt: activeRequest.createdAt,
            },
          ]
        : []

  const messages = [...olderMessages, ...baseMessages, ...pendingMessages]

  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(activeRequest.status)
  const canCompose = !readOnly && !isClosed
  const attachmentsByMessage = indexAttachmentsByMessage(baseMessages, activeRequest.attachments)
  const { panelRef, scrollToBottom } = useThreadAutoScroll(messages, activeRequest.id)
  const fetchDownloadUrl = useCallback(
    (attachmentId: string) => fetchAttachmentDownloadUrl(attachmentId),
    [],
  )

  const loadOlderMessages = async () => {
    const oldest = [...olderMessages, ...baseMessages].find(
      (message) => !isPendingRequestMessage(message) && message.id !== 'initial',
    )
    if (!oldest || loadingOlder) return
    setLoadingOlder(true)
    try {
      const page = await fetchAdminBff<{
        messages: ProjectRequestMessage[]
        nextCursor: string | null
      }>(
        `/api/project-requests/${activeRequest.id}/messages?cursor=${encodeURIComponent(oldest.id)}&limit=50`,
      )
      setOlderMessages((prev) => [...page.messages, ...prev])
      setHasMoreOlder(Boolean(page.nextCursor))
    } finally {
      setLoadingOlder(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || uploading) return

    const bodyText = reply.trim()
    const savedReply = bodyText
    const savedSelectedIds = [...selectedAttachmentIds]
    const savedPendingFiles = [...pendingFiles]
    const hasUploads = savedPendingFiles.length > 0
    const optimistic = createOptimisticRequestMessage({
      requestId: activeRequest.id,
      body: bodyText,
      authorRole: viewerRole === 'CLIENT' ? 'CLIENT' : 'ADMIN',
      authorUserId: viewerRole === 'ADMIN' ? currentUserId ?? undefined : undefined,
    })
    const optimisticId = optimistic.id

    setPendingMessages((prev) => [...prev, optimistic])
    setReply('')
    setSelectedAttachmentIds([])
    setPendingFiles([])
    setError(null)
    scrollToBottom(true)

    try {
      if (hasUploads) setUploading(true)
      const uploaded = await resolvePendingMessageAttachments(
        activeRequest.projectId,
        savedPendingFiles,
        uploadVisibility ? { visibility: uploadVisibility } : undefined,
      )
      if (!uploaded.ok) {
        setPendingMessages((prev) => prev.filter((message) => message.id !== optimisticId))
        setReply(savedReply)
        setSelectedAttachmentIds(savedSelectedIds)
        setPendingFiles(savedPendingFiles)
        setError(uploaded.message ?? 'Could not upload attachments')
        return
      }

      const attachmentIds = [
        ...new Set([...savedSelectedIds, ...uploaded.attachmentIds]),
      ]
      const result = await onSendMessage(bodyText, attachmentIds)
      if (!result.ok) {
        setPendingMessages((prev) => prev.filter((message) => message.id !== optimisticId))
        setReply(savedReply)
        setSelectedAttachmentIds(savedSelectedIds)
        setPendingFiles(savedPendingFiles)
        setError(result.message ?? 'Could not send message')
      } else {
        setPendingMessages((prev) => prev.filter((message) => message.id !== optimisticId))
      }
    } catch {
      setPendingMessages((prev) => prev.filter((message) => message.id !== optimisticId))
      setReply(savedReply)
      setSelectedAttachmentIds(savedSelectedIds)
      setPendingFiles(savedPendingFiles)
      setError('Could not send message')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-message-thread-shell max-h-[min(56svh,520px)]">
      <div ref={panelRef} className="admin-thread-panel">
        {hasMoreOlder ? (
          <button
            type="button"
            disabled={loadingOlder}
            onClick={() => void loadOlderMessages()}
            className="mb-3 text-xs text-sanmarino hover:underline disabled:opacity-50"
          >
            {loadingOlder ? 'Loading older messages…' : 'Load older messages'}
          </button>
        ) : null}
        {messages.length === 0 ? (
          <p className="text-sm text-app-muted">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const baseIndex = baseMessages.findIndex((entry) => entry.id === msg.id)
            const messageAttachments =
              baseIndex >= 0 ? attachmentsByMessage.get(baseIndex) : undefined
            const isMine = messageIsMine(msg, viewerRole, currentUserId)
            const authorLabel = messageAuthorLabel(msg, isMine)
            const isPending = isPendingRequestMessage(msg.id)
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
                  } ${isPending ? 'opacity-80' : ''} ${bricolage_grot600.className}`}
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
        <form onSubmit={(e) => void onSubmit(e)} className="shrink-0 space-y-2 border-t border-chambray/10 pt-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                viewerRole === 'CLIENT'
                  ? 'Write your response to CoCreate…'
                  : activeRequest.type === 'INTERNAL'
                    ? 'Message the team…'
                    : 'Follow up with the client…'
              }
              rows={3}
              className="admin-textarea w-full resize-y"
            />
          </div>
          <MessageAttachmentComposer
            projectId={activeRequest.projectId}
            disabled={uploading}
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
              disabled={uploading}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
              }
            />
            <button
              type="submit"
              disabled={uploading || !reply.trim()}
              className="admin-btn-primary text-sm"
            >
              {uploading ? 'Uploading…' : 'Send message'}
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
        <p className="shrink-0 text-sm text-app-muted">This conversation is closed ({activeRequest.status}).</p>
      ) : readOnly ? (
        <p className="shrink-0 text-sm text-app-muted">Archived (read only).</p>
      ) : null}
    </div>
  )
}
