'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import EmojiPickerButton from '@/components/emoji-picker-button'
import { useAdminSession } from '@/components/admin-session-provider'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import { stageProjectFiles } from '@/lib/projects/fetch-project-files'
import type { StagedProjectFile } from '@/lib/projects/fetch-project-files'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useAdminRequestThreadQuery } from '@/lib/api/queries/projects'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { ThreadScrollEnd } from '@cocreate/app-ui/scroll-to-latest'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import type { ThreadAttachment } from '@/lib/projects/thread-content'
import { removeThreadAttachment } from '@/lib/projects/remove-thread-attachment'
import { isCoreTeamSession } from '@/lib/admin-session'
import { canRemoveThreadAttachment } from '@cocreate/app-ui/thread-message-merge'
import {
  approvalItemsForMessage,
  nonApprovalMessageAttachments,
} from '@cocreate/app-ui/thread-approval-match'
import AdminThreadApprovalCard from '@/components/admin-thread-approval-card'
import {
  createOptimisticRequestMessage,
  isPendingRequestMessage,
} from '@/lib/projects/optimistic-request-message'
import { useRequestThreadRealtime } from '@/lib/projects/use-request-thread-realtime'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import { bricolage_grot600 } from '@/styles/fonts'
import type { ThreadApprovalItem } from '@/lib/projects/thread-approval-items'

export type CheckpointComposeConfig = {
  enabled: boolean
  title: string
  onTitleChange: (value: string) => void
  requestApproval: boolean
  onRequestApprovalChange: (value: boolean) => void
  onSendCheckpoint: (payload: {
    title: string
    body: string
    attachmentIds: string[]
    stagedAttachments?: StagedProjectFile[]
  }) => Promise<{ ok: boolean; message?: string }>
}

function canSendCheckpointThreadMessage(
  title: string,
  body: string,
  selectedAttachmentIds: string[],
  pendingFiles: File[],
  uploading: boolean,
): boolean {
  if (uploading) return false
  if (!title.trim()) return false
  return canSendThreadMessage(body, selectedAttachmentIds, pendingFiles, false)
}

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
  checkpointCompose?: CheckpointComposeConfig
  threadApprovalItems?: ThreadApprovalItem[]
  onApprovalReply?: (
    approvalItemId: string,
    body: string,
  ) => Promise<{ ok: boolean; message?: string }>
  onApprovalUploadRevision?: (
    approvalItemId: string,
    file: File,
    note?: string,
  ) => Promise<{ ok: boolean; message?: string }>
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
  checkpointCompose,
  threadApprovalItems = [],
  onApprovalReply,
  onApprovalUploadRevision,
}: RequestMessageThreadProps) {
  const queryClient = useQueryClient()
  const { session } = useAdminSession()
  const isCoreTeam =
    session?.mode === 'user' && isCoreTeamSession(session.role)
  const threadQuery = useAdminRequestThreadQuery(request.id)
  const activeRequest =
    threadQuery.data?.id === request.id ? threadQuery.data : request

  useEffect(() => {
    setOlderMessages([])
    setHasMoreOlder(
      (activeRequest.messageCount ?? activeRequest.messages?.length ?? 0) >= 50,
    )
  }, [activeRequest.id, activeRequest.messageCount, activeRequest.messages?.length])

  useEffect(() => {
    setReply('')
    setSelectedAttachmentIds([])
    setPendingFiles([])
    setPendingMessages([])
    setError(null)
    setSendingCheckpoint(false)
  }, [request.id])

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
  const [sendingCheckpoint, setSendingCheckpoint] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
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
  const { panelRef, endRef, notifyUserSent } = useThreadAutoScroll(messages, activeRequest.id)
  const fetchDownloadUrl = useCallback(
    (attachmentId: string) => fetchAttachmentDownloadUrl(attachmentId),
    [],
  )

  const canDeleteAttachmentOnMessage = useCallback(
    (msg: ProjectRequestMessage, attachment: ThreadAttachment) =>
      canRemoveThreadAttachment({
        messageId: msg.id,
        messageAuthorRole: msg.authorRole,
        attachmentUploadedByUserId: attachment.uploadedByUserId,
        currentUserId,
        viewerRole,
        isCoreTeam,
        readOnly,
      }),
    [currentUserId, isCoreTeam, readOnly, viewerRole],
  )

  const handleDeleteAttachment = useCallback(
    async (messageId: string, attachment: ThreadAttachment) => {
      const prompt =
        viewerRole === 'ADMIN'
          ? `Remove ${attachment.fileName} from this conversation? The client will no longer see it here.`
          : `Remove ${attachment.fileName} from this conversation?`
      if (!window.confirm(prompt)) return

      setDeletingAttachmentId(attachment.id)
      setError(null)
      try {
        await removeThreadAttachment(queryClient, {
          requestId: activeRequest.id,
          messageId,
          attachmentId: attachment.id,
          organizationId: activeRequest.organizationId ?? undefined,
          projectId: activeRequest.projectId,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove file')
      } finally {
        setDeletingAttachmentId(null)
      }
    },
    [activeRequest, queryClient, viewerRole],
  )

  const loadOlderMessages = async () => {
    const oldest = [...olderMessages, ...baseMessages].find(
      (message) => !isPendingRequestMessage(message.id) && message.id !== 'initial',
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
    if (
      !canSendThreadMessage(reply, selectedAttachmentIds, pendingFiles, uploading)
    ) {
      return
    }

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
    notifyUserSent()

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

  const onSubmitCheckpoint = async (e: FormEvent) => {
    e.preventDefault()
    if (!checkpointCompose?.enabled || !checkpointCompose.requestApproval) return
    if (
      !canSendCheckpointThreadMessage(
        checkpointCompose.title,
        reply,
        selectedAttachmentIds,
        pendingFiles,
        uploading || sendingCheckpoint,
      )
    ) {
      return
    }

    const bodyText = reply.trim()
    const savedReply = bodyText
    const savedTitle = checkpointCompose.title
    const savedSelectedIds = [...selectedAttachmentIds]
    const savedPendingFiles = [...pendingFiles]
    const hasUploads = savedPendingFiles.length > 0

    setSendingCheckpoint(true)
    setError(null)

    try {
      if (hasUploads) setUploading(true)

      let attachmentIds = [...savedSelectedIds]
      let stagedAttachments: StagedProjectFile[] | undefined

      if (hasUploads && checkpointCompose.requestApproval) {
        try {
          stagedAttachments = await stageProjectFiles(activeRequest.projectId, savedPendingFiles)
        } catch (err) {
          setReply(savedReply)
          setSelectedAttachmentIds(savedSelectedIds)
          setPendingFiles(savedPendingFiles)
          setError(err instanceof Error ? err.message : 'Could not upload attachments')
          return
        }
      } else if (hasUploads) {
        const uploaded = await resolvePendingMessageAttachments(
          activeRequest.projectId,
          savedPendingFiles,
          uploadVisibility ? { visibility: uploadVisibility } : undefined,
        )
        if (!uploaded.ok) {
          setReply(savedReply)
          setSelectedAttachmentIds(savedSelectedIds)
          setPendingFiles(savedPendingFiles)
          setError(uploaded.message ?? 'Could not upload attachments')
          return
        }
        attachmentIds = [...new Set([...attachmentIds, ...uploaded.attachmentIds])]
      }

      const result = await checkpointCompose.onSendCheckpoint({
        title: savedTitle.trim(),
        body: bodyText,
        attachmentIds,
        stagedAttachments,
      })
      if (!result.ok) {
        setReply(savedReply)
        setSelectedAttachmentIds(savedSelectedIds)
        setPendingFiles(savedPendingFiles)
        setError(result.message ?? 'Could not send progress check')
      } else {
        setReply('')
        setSelectedAttachmentIds([])
        setPendingFiles([])
      }
    } catch {
      setReply(savedReply)
      setSelectedAttachmentIds(savedSelectedIds)
      setPendingFiles(savedPendingFiles)
      setError('Could not send progress check')
    } finally {
      setUploading(false)
      setSendingCheckpoint(false)
    }
  }

  const checkpointMode =
    Boolean(checkpointCompose?.enabled) && Boolean(checkpointCompose?.requestApproval)
  const composeBusy = uploading || sendingCheckpoint

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
            const attachmentIdsForMessage =
              messageAttachments?.map((attachment) => attachment.id) ?? []
            const inlineApprovalItems =
              request.type === 'PROGRESS' && threadApprovalItems.length > 0
                ? approvalItemsForMessage(
                    msg.id,
                    activeRequest.id,
                    attachmentIdsForMessage,
                    threadApprovalItems,
                  )
                : []
            const displayAttachments = nonApprovalMessageAttachments(
              messageAttachments,
              inlineApprovalItems,
            )
            const isMine = messageIsMine(msg, viewerRole, currentUserId)
            const authorLabel = messageAuthorLabel(msg, isMine)
            const isPending = isPendingRequestMessage(msg.id)
            const showMessageBubble =
              Boolean(msg.body.trim()) ||
              msg.messageKind === 'CHECKPOINT' ||
              Boolean(msg.supersededAt) ||
              Boolean(msg.clientApprovedAt) ||
              Boolean(msg.isPendingApproval)
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
                {showMessageBubble ? (
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
                  {msg.body.trim() ? <LinkifiedBody body={msg.body} /> : null}
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
                ) : null}
                {displayAttachments.length ? (
                  <RequestAttachments
                    attachments={displayAttachments}
                    fetchDownloadUrl={fetchDownloadUrl}
                    variant="admin"
                    showHeading={false}
                    className={`mt-2 max-w-[90%] ${isMine ? 'self-end' : 'self-start'}`}
                    canDeleteAttachment={(attachmentId) => {
                      const attachment = displayAttachments.find((item) => item.id === attachmentId)
                      return attachment
                        ? canDeleteAttachmentOnMessage(msg, attachment)
                        : false
                    }}
                    deletingAttachmentId={deletingAttachmentId}
                    onDeleteAttachment={
                      displayAttachments.some((attachment) =>
                        canDeleteAttachmentOnMessage(msg, attachment),
                      )
                        ? (attachmentId) => {
                            const attachment = displayAttachments.find(
                              (item) => item.id === attachmentId,
                            )
                            if (!attachment || !canDeleteAttachmentOnMessage(msg, attachment)) {
                              return
                            }
                            void handleDeleteAttachment(msg.id, attachment)
                          }
                        : undefined
                    }
                  />
                ) : null}
                {inlineApprovalItems.length > 0 && onApprovalReply
                  ? inlineApprovalItems.map((item) => (
                      <AdminThreadApprovalCard
                        key={item.id}
                        item={item}
                        onReply={onApprovalReply}
                        onUploadRevision={onApprovalUploadRevision}
                      />
                    ))
                  : null}
              </div>
            )
          })
        )}
        <ThreadScrollEnd ref={endRef} />
      </div>

      {canCompose ? (
        <form
          onSubmit={(e) =>
            void (checkpointMode ? onSubmitCheckpoint(e) : onSubmit(e))
          }
          className="admin-thread-composer shrink-0 space-y-2 border-t border-chambray/10 pt-4"
        >
          {checkpointCompose?.enabled ? (
            <label className="flex items-center gap-2 text-sm text-app-muted">
              <input
                type="checkbox"
                checked={checkpointCompose.requestApproval}
                onChange={(e) => checkpointCompose.onRequestApprovalChange(e.target.checked)}
                disabled={composeBusy}
                className="rounded border-chambray/30"
              />
              Send for approval
            </label>
          ) : null}
          {checkpointMode ? (
            <input
              type="text"
              value={checkpointCompose?.title ?? ''}
              onChange={(e) => checkpointCompose?.onTitleChange(e.target.value)}
              placeholder="Title (e.g. Approve phase 2 deliverables)"
              disabled={composeBusy}
              className="admin-input w-full"
            />
          ) : null}
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
              rows={2}
              className="admin-textarea min-h-16 w-full resize-y md:min-h-[5.5rem]"
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="admin-thread-composer-toolbar flex flex-wrap items-center gap-2">
            <MessageAttachmentComposer
              projectId={activeRequest.projectId}
              disabled={composeBusy}
              libraryVisibility={libraryVisibility}
              selectedIds={selectedAttachmentIds}
              pendingFiles={pendingFiles}
              onSelectedIdsChange={setSelectedAttachmentIds}
              onPendingFilesChange={setPendingFiles}
              toolbar
            />
            <EmojiPickerButton
              variant="admin"
              disabled={composeBusy}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
              }
            />
            <button
              type="submit"
              disabled={
                checkpointMode
                  ? !canSendCheckpointThreadMessage(
                      checkpointCompose?.title ?? '',
                      reply,
                      selectedAttachmentIds,
                      pendingFiles,
                      composeBusy,
                    )
                  : !canSendThreadMessage(
                      reply,
                      selectedAttachmentIds,
                      pendingFiles,
                      composeBusy,
                    )
              }
              className="admin-btn-primary ml-auto text-sm"
            >
              {composeBusy ? (
                uploading ? (
                  'Uploading…'
                ) : (
                  'Sending…'
                )
              ) : checkpointMode ? (
                'Send for approval'
              ) : (
                <>
                  <span className="md:hidden">Send</span>
                  <span className="hidden md:inline">Send message</span>
                </>
              )}
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
