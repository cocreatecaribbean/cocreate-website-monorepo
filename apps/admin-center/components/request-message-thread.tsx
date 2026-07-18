'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AttachmentReactionCluster } from '@cocreate/app-ui/attachment-previews'
import EmojiPickerButton from '@/components/emoji-picker-button'
import { useAdminSession } from '@/components/admin-session-provider'
import { useProjectFileReactions } from '@/lib/api/queries/file-reactions'
import { emojisFromReactionTags } from '@/lib/projects/file-reaction-display'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useAdminThreadLive } from '@/lib/messaging/use-admin-thread-live'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { ThreadScrollEnd } from '@cocreate/app-ui/scroll-to-latest'
import ResizableMessageTextarea from '@cocreate/app-ui/resizable-message-textarea'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import type { ThreadAttachment } from '@/lib/projects/thread-content'
import { removeThreadAttachment } from '@/lib/projects/remove-thread-attachment'
import { isCoreTeamSession } from '@/lib/admin-session'
import { canRemoveThreadAttachment } from '@cocreate/app-ui/thread-message-merge'
import {
  addOptimisticRequestMessageToMessagesList,
  invalidateRequestThreadMessages,
  replacePendingRequestMessageInMessagesList,
  rollbackOptimisticRequestMessageInMessagesList,
} from '@/lib/projects/append-request-messages-list-cache'
import {
  createOptimisticRequestMessage,
  isPendingRequestMessage,
} from '@/lib/projects/optimistic-request-message'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import { bricolage_grot600 } from '@/styles/fonts'

type RequestMessageThreadProps = {
  request: ProjectRequestItem
  loadMessages?: boolean
  /** Parent workspace owns messages query + socket (progress path). */
  parentOwnsMessages?: boolean
  liveMessages?: ProjectRequestMessage[]
  liveMessagesLoading?: boolean
  viewerRole: 'ADMIN' | 'CLIENT'
  currentUserId?: string | null
  libraryVisibility?: 'CLIENT' | 'INTERNAL'
  uploadVisibility?: 'CLIENT' | 'INTERNAL'
  readOnly?: boolean
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string; data?: ProjectRequestMessage }>
  onThreadUpdate?: () => void
  /** Notify parent of the latest message id (for mark-read-while-viewing). */
  onLatestMessageIdChange?: (messageId: string | null) => void
  invalidateQueryKeys?: import('@tanstack/react-query').QueryKey[]
}

function initialAuthorRole(request: ProjectRequestItem): 'ADMIN' | 'CLIENT' {
  if (request.type === 'ONBOARDING') return 'CLIENT'
  if (request.type === 'CANCELLATION') return 'CLIENT'
  return 'ADMIN'
}

function ThreadLoadingSkeleton() {
  return (
    <div className="space-y-3 py-2" aria-busy="true" aria-label="Loading messages">
      <div className="h-16 animate-pulse rounded-lg bg-chambray/8" />
      <div className="ml-8 h-12 animate-pulse rounded-lg bg-chambray/6" />
      <div className="h-14 animate-pulse rounded-lg bg-chambray/8" />
    </div>
  )
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
  loadMessages = true,
  parentOwnsMessages = false,
  liveMessages,
  liveMessagesLoading = false,
  viewerRole,
  currentUserId,
  libraryVisibility,
  uploadVisibility,
  onSendMessage,
  readOnly = false,
  onThreadUpdate,
  onLatestMessageIdChange,
  invalidateQueryKeys,
}: RequestMessageThreadProps) {
  const queryClient = useQueryClient()
  const { session } = useAdminSession()
  const { reactionsById } = useProjectFileReactions(request.projectId)
  const isCoreTeam =
    session?.mode === 'user' && isCoreTeamSession(session.role)
  const refreshFileReactions = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: adminQueryKeys.fileReactions.project(request.projectId),
    })
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.topPicks.all })
  }, [queryClient, request.projectId])
  const threadLive = useAdminThreadLive(
    !parentOwnsMessages && loadMessages ? request.id : undefined,
    {
      onThreadUpdate,
      onAttachmentUpdate: refreshFileReactions,
      invalidateQueryKeys,
    },
  )
  const threadLoading = parentOwnsMessages
    ? liveMessagesLoading
    : loadMessages && threadLive.isLoading

  const [reply, setReply] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [olderMessages, setOlderMessages] = useState<ProjectRequestMessage[]>([])
  const [hasMoreOlder, setHasMoreOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOlderMessages([])
    setHasMoreOlder((request.messageCount ?? request.messages?.length ?? 0) >= 50)
  }, [request.id, request.messageCount, request.messages?.length])

  useEffect(() => {
    setReply('')
    setSelectedAttachmentIds([])
    setPendingFiles([])
    setError(null)
  }, [request.id])

  const queryMessages = parentOwnsMessages ? liveMessages : threadLive.messages
  const baseMessages: ProjectRequestMessage[] =
    queryMessages && queryMessages.length > 0
      ? queryMessages
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

  const messages = [...olderMessages, ...baseMessages]
  const latestMessageId = messages.length > 0 ? messages[messages.length - 1]!.id : null

  useEffect(() => {
    onLatestMessageIdChange?.(latestMessageId)
  }, [latestMessageId, onLatestMessageIdChange])

  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(request.status)
  const canCompose = !readOnly && !isClosed
  const attachmentsByMessage = indexAttachmentsByMessage(baseMessages, request.attachments)
  const { panelRef, endRef, notifyUserSent } = useThreadAutoScroll(messages, request.id)
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
          requestId: request.id,
          messageId,
          attachmentId: attachment.id,
          organizationId: request.organizationId ?? undefined,
          projectId: request.projectId,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove file')
      } finally {
        setDeletingAttachmentId(null)
      }
    },
    [request, queryClient, viewerRole],
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
        `/api/project-requests/${request.id}/messages?cursor=${encodeURIComponent(oldest.id)}&limit=50`,
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
      requestId: request.id,
      body: bodyText,
      authorRole: viewerRole === 'CLIENT' ? 'CLIENT' : 'ADMIN',
      authorUserId: viewerRole === 'ADMIN' ? currentUserId ?? undefined : undefined,
    })
    const optimisticId = optimistic.id

    await queryClient.cancelQueries({
      queryKey: adminQueryKeys.requests.messages(request.id),
    })
    addOptimisticRequestMessageToMessagesList(queryClient, request.id, optimistic)
    setReply('')
    setSelectedAttachmentIds([])
    setPendingFiles([])
    setError(null)
    notifyUserSent()

    try {
      if (hasUploads) setUploading(true)
      const uploaded = await resolvePendingMessageAttachments(
        request.projectId,
        savedPendingFiles,
        uploadVisibility ? { visibility: uploadVisibility } : undefined,
      )
      if (!uploaded.ok) {
        rollbackOptimisticRequestMessageInMessagesList(queryClient, request.id, optimisticId)
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
        rollbackOptimisticRequestMessageInMessagesList(queryClient, request.id, optimisticId)
        setReply(savedReply)
        setSelectedAttachmentIds(savedSelectedIds)
        setPendingFiles(savedPendingFiles)
        setError(result.message ?? 'Could not send message')
        return
      }

      if (result.data) {
        const replaced = replacePendingRequestMessageInMessagesList(
          queryClient,
          request.id,
          optimisticId,
          result.data,
        )
        if (!replaced) {
          invalidateRequestThreadMessages(queryClient, request.id)
        }
      } else {
        invalidateRequestThreadMessages(queryClient, request.id)
      }
    } catch {
      rollbackOptimisticRequestMessageInMessagesList(queryClient, request.id, optimisticId)
      setReply(savedReply)
      setSelectedAttachmentIds(savedSelectedIds)
      setPendingFiles(savedPendingFiles)
      setError('Could not send message')
    } finally {
      setUploading(false)
    }
  }

  const composeBusy = uploading

  return (
    <div className="admin-message-thread-shell admin-message-thread-shell--capped">
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
        {threadLoading ? (
          <ThreadLoadingSkeleton />
        ) : messages.length === 0 ? (
          <p className="text-sm text-app-muted">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const baseIndex = baseMessages.findIndex((entry) => entry.id === msg.id)
            const messageAttachments =
              msg.attachments?.length
                ? msg.attachments
                : baseIndex >= 0
                  ? attachmentsByMessage.get(baseIndex)
                  : undefined
            const displayAttachments = messageAttachments ?? []
            const isMine = messageIsMine(msg, viewerRole, currentUserId)
            const authorLabel = messageAuthorLabel(msg, isMine)
            const isPending = isPendingRequestMessage(msg.id)
            const showMessageBubble = Boolean(msg.body.trim())
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
                  <LinkifiedBody body={msg.body} />
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
                    renderAttachmentAction={(attachment) => {
                      const reacted = reactionsById.get(attachment.id)
                      if (!reacted?.tags.length) return null
                      return (
                        <AttachmentReactionCluster
                          emojis={emojisFromReactionTags(reacted.tags)}
                        />
                      )
                    }}
                  />
                ) : null}
              </div>
            )
          })
        )}
        <ThreadScrollEnd ref={endRef} />
      </div>

      {canCompose ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="admin-thread-composer shrink-0 space-y-2 border-t border-chambray/10 pt-4"
        >
          <div className="relative">
            <ResizableMessageTextarea
              ref={textareaRef}
              storageKey={`admin-thread-composer:${request.id}`}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                viewerRole === 'CLIENT'
                  ? 'Write your response to CoCreate…'
                  : request.type === 'INTERNAL'
                    ? 'Message the team…'
                    : 'Follow up with the client…'
              }
              className="admin-textarea w-full"
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="admin-thread-composer-toolbar flex flex-wrap items-center gap-2">
            <MessageAttachmentComposer
              projectId={request.projectId}
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
                !canSendThreadMessage(reply, selectedAttachmentIds, pendingFiles, composeBusy)
              }
              className="admin-btn-primary ml-auto text-sm"
            >
              {composeBusy ? (
                uploading ? (
                  'Uploading…'
                ) : (
                  'Sending…'
                )
              ) : (
                <>
                  <span className="md:hidden">Send</span>
                  <span className="hidden md:inline">Send message</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : isClosed ? (
        <p className="shrink-0 text-sm text-app-muted">This conversation is closed ({request.status}).</p>
      ) : readOnly ? (
        <p className="shrink-0 text-sm text-app-muted">Archived (read only).</p>
      ) : null}
    </div>
  )
}
