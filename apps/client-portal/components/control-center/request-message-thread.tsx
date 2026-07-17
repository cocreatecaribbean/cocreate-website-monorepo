'use client'

import { FormEvent, useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AttachmentReactionCluster } from '@cocreate/app-ui/attachment-previews'
import EmojiPickerButton from '@/components/emoji-picker-button'
import FileReactionMenu from '@/components/control-center/file-reaction-menu'
import {
  useProjectFileReactions,
  useSyncFileReactionCache,
} from '@/lib/api/queries/file-reactions'
import { emojisFromReactionTags } from '@/lib/projects/file-reaction-display'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import ResizableMessageTextarea from '@cocreate/app-ui/resizable-message-textarea'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { ThreadScrollEnd } from '@cocreate/app-ui/scroll-to-latest'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/api-types'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import type { ThreadAttachment } from '@/lib/projects/thread-content'
import { removeThreadAttachment } from '@/lib/projects/remove-thread-attachment'
import { useClientThreadLive } from '@/lib/messaging/use-client-thread-live'
import { queryKeys } from '@/lib/api/query-keys'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'
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
  readOnly?: boolean
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string; data?: ProjectRequestMessage }>
  onThreadUpdate?: () => void
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

export default function RequestMessageThread({
  request,
  loadMessages = true,
  parentOwnsMessages = false,
  liveMessages,
  liveMessagesLoading = false,
  viewerRole,
  onSendMessage,
  readOnly = false,
  onThreadUpdate,
  invalidateQueryKeys,
}: RequestMessageThreadProps) {
  const queryClient = useQueryClient()
  const { data: profile } = usePortalProfileQuery()
  const { canReactToFiles } = usePortalPermissions()
  const { reactionsById } = useProjectFileReactions(request.projectId)
  const syncReactionCache = useSyncFileReactionCache(request.projectId)
  const currentUserId = profile?.user.id ?? null
  const refreshFileReactions = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.fileReactions.project(request.projectId),
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.topPicks.all })
  }, [queryClient, request.projectId])
  const threadLive = useClientThreadLive(
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
  const [uploading, setUploading] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const messages = baseMessages

  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(request.status)
  const canCompose = !readOnly && !isClosed
  const attachmentsByMessage = indexAttachmentsByMessage(baseMessages, request.attachments)
  const { panelRef, endRef, notifyUserSent } = useThreadAutoScroll(messages, request.id)
  const inputClass = 'portal-textarea w-full resize-y'
  const btnPrimary = 'portal-btn-primary text-sm'

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
        readOnly,
      }),
    [currentUserId, readOnly, viewerRole],
  )

  const handleDeleteAttachment = useCallback(
    async (messageId: string, attachment: ThreadAttachment) => {
      if (
        !window.confirm(
          `Remove ${attachment.fileName} from this conversation? CoCreate will no longer see it here.`,
        )
      ) {
        return
      }

      setDeletingAttachmentId(attachment.id)
      setError(null)
      const result = await removeThreadAttachment(queryClient, {
        requestId: request.id,
        messageId,
        attachmentId: attachment.id,
        projectId: request.projectId,
      })
      if (!result.ok) {
        setError(result.message)
      }
      setDeletingAttachmentId(null)
    },
    [request.id, request.projectId, queryClient],
  )

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
      authorUserId: currentUserId ?? undefined,
    })
    const optimisticId = optimistic.id

    await queryClient.cancelQueries({ queryKey: queryKeys.requests.messages(request.id) })
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

  return (
    <div className="portal-message-thread-shell max-h-[min(56svh,520px)]">
      <div ref={panelRef} className="portal-thread-panel">
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
            const isMine = viewerRole === 'CLIENT' && msg.authorRole === 'CLIENT'
            const isPending = isPendingRequestMessage(msg.id)
            const displayAttachments = messageAttachments ?? []

            const showMessageBubble = Boolean(msg.body.trim())
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <p className="text-[0.65rem] font-medium text-app-muted">
                  {isMine
                    ? 'You'
                    : msg.authorRole === 'ADMIN' || msg.authorRole === 'COLLABORATOR'
                      ? formatActorWithTitle(
                          msg.authorDisplayName,
                          msg.authorJobTitle,
                          msg.authorEmail,
                        ) ??
                        (msg.authorRole === 'COLLABORATOR' ? 'Collaborator' : 'CoCreate team')
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
                {showMessageBubble ? (
                <div
                  className={`mt-1 max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    isMine ? 'portal-msg-mine' : 'portal-msg-theirs'
                  } ${isPending ? 'opacity-80' : ''} ${bricolage_grot600.className}`}
                >
                  {msg.body.trim() ? <LinkifiedBody body={msg.body} /> : null}
                </div>
                ) : null}
                {displayAttachments.length ? (
                  <RequestAttachments
                    attachments={displayAttachments}
                    fetchDownloadUrl={fetchDownloadUrl}
                    variant="portal"
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
                    renderAttachmentBadge={(attachment) => {
                      const reacted = reactionsById.get(attachment.id)
                      if (!reacted?.tags.length) return null
                      return (
                        <AttachmentReactionCluster
                          emojis={emojisFromReactionTags(reacted.tags)}
                        />
                      )
                    }}
                    renderAttachmentAction={
                      canReactToFiles
                        ? (attachment) => (
                            <FileReactionMenu
                              attachmentId={attachment.id}
                              compact
                              initialReaction={
                                reactionsById.get(attachment.id)?.myReaction ?? null
                              }
                              onChange={syncReactionCache}
                            />
                          )
                        : undefined
                    }
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
          className="portal-thread-composer shrink-0 space-y-2 border-t border-chambray/10 pt-4"
        >
          <div className="relative">
            <ResizableMessageTextarea
              ref={textareaRef}
              storageKey={`portal-thread-composer:${request.id}`}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                viewerRole === 'CLIENT'
                  ? 'Write your response to CoCreate…'
                  : 'Follow up with the client…'
              }
              className={inputClass}
            />
          </div>
          {error ? <p className="portal-alert-error">{error}</p> : null}
          <div className="portal-thread-composer-toolbar flex flex-wrap items-center gap-2">
            <MessageAttachmentComposer
              projectId={request.projectId}
              variant="portal"
              disabled={uploading}
              selectedIds={selectedAttachmentIds}
              pendingFiles={pendingFiles}
              onSelectedIdsChange={setSelectedAttachmentIds}
              onPendingFilesChange={setPendingFiles}
              toolbar
            />
            <EmojiPickerButton
              variant="portal"
              disabled={uploading}
              onSelect={(emoji) =>
                insertAtTextareaCursor(textareaRef.current, emoji, reply, setReply)
              }
            />
            <button
              type="submit"
              disabled={
                !canSendThreadMessage(reply, selectedAttachmentIds, pendingFiles, uploading)
              }
              className={`${btnPrimary} ml-auto`}
            >
              {uploading ? (
                'Uploading…'
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
        <p className="shrink-0 text-sm text-app-muted">Archived conversation (read only).</p>
      ) : null}
    </div>
  )
}
