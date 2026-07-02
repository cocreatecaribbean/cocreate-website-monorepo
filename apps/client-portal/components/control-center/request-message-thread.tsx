'use client'

import { FormEvent, useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import EmojiPickerButton from '@/components/emoji-picker-button'
import MessageAttachmentComposer, {
  resolvePendingMessageAttachments,
} from '@/components/message-attachment-composer'
import ThreadApprovalCard from '@/components/control-center/thread-approval-card'
import { insertAtTextareaCursor } from '@/lib/insert-at-textarea-cursor'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { ThreadScrollEnd } from '@cocreate/app-ui/scroll-to-latest'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/api-types'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { LinkifiedBody, indexAttachmentsByMessage, RequestAttachments } from '@/lib/projects/thread-content'
import type { ThreadAttachment } from '@/lib/projects/thread-content'
import { removeThreadAttachment } from '@/lib/projects/remove-thread-attachment'
import { useRequestThreadQuery } from '@/lib/api/queries/projects'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { canRemoveThreadAttachment } from '@cocreate/app-ui/thread-message-merge'
import {
  createOptimisticRequestMessage,
  isPendingRequestMessage,
} from '@/lib/projects/optimistic-request-message'
import { useRequestThreadRealtime } from '@/lib/projects/use-request-thread-realtime'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import type { PendingApprovalFile } from '@/lib/projects/pending-approval-files'
import {
  nonApprovalMessageAttachments,
  pendingApprovalFilesForMessage,
} from '@/lib/projects/pending-approval-files'
import { bricolage_grot600 } from '@/styles/fonts'

type RequestMessageThreadProps = {
  request: ProjectRequestItem
  viewerRole: 'ADMIN' | 'CLIENT'
  readOnly?: boolean
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string }>
  onResolve?: (status: 'RESOLVED' | 'REJECTED') => Promise<void>
  showResolveActions?: boolean
  onThreadUpdate?: () => void
  invalidateQueryKeys?: import('@tanstack/react-query').QueryKey[]
  pendingApprovalFiles?: PendingApprovalFile[]
  onApproveFile?: (
    approvalItemId: string,
  ) => Promise<{ ok: boolean; message?: string }>
  onNeedsChangesFile?: (
    approvalItemId: string,
    body?: string,
  ) => Promise<{ ok: boolean; message?: string }>
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
  onResolve,
  showResolveActions = false,
  readOnly = false,
  onThreadUpdate,
  invalidateQueryKeys,
  pendingApprovalFiles = [],
  onApproveFile,
  onNeedsChangesFile,
}: RequestMessageThreadProps) {
  const queryClient = useQueryClient()
  const { data: profile } = usePortalProfileQuery()
  const currentUserId = profile?.user.id ?? null
  const threadQuery = useRequestThreadQuery(request.id)
  const activeRequest =
    threadQuery.data?.id === request.id ? threadQuery.data : request

  useRequestThreadRealtime(activeRequest.id, onThreadUpdate, {
    enabled: Boolean(onThreadUpdate || invalidateQueryKeys?.length),
    invalidateQueryKeys,
  })

  const inputClass = 'portal-textarea w-full resize-y'
  const btnPrimary = 'portal-btn-primary text-sm'
  const btnGhost = 'portal-btn-ghost text-sm'
  const [reply, setReply] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingMessages, setPendingMessages] = useState<ProjectRequestMessage[]>([])
  const [uploading, setUploading] = useState(false)
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

  const messages = [...baseMessages, ...pendingMessages]

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
        requestId: activeRequest.id,
        messageId,
        attachmentId: attachment.id,
        projectId: activeRequest.projectId,
      })
      if (!result.ok) {
        setError(result.message)
      }
      setDeletingAttachmentId(null)
    },
    [activeRequest.id, activeRequest.projectId, queryClient],
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
        request.projectId,
        savedPendingFiles,
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
    <div className="portal-message-thread-shell max-h-[min(56svh,520px)]">
      <div ref={panelRef} className="portal-thread-panel">
        {messages.length === 0 ? (
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
            const attachmentIdsForMessage =
              messageAttachments?.map((attachment) => attachment.id) ?? []
            const inlineApprovalFiles =
              viewerRole === 'CLIENT' && onApproveFile && onNeedsChangesFile
                ? pendingApprovalFilesForMessage(
                    msg.id,
                    activeRequest.id,
                    attachmentIdsForMessage,
                    pendingApprovalFiles,
                  )
                : []

            const displayAttachments = nonApprovalMessageAttachments(
              messageAttachments,
              inlineApprovalFiles,
            )

            const showMessageBubble =
              Boolean(msg.body.trim()) ||
              msg.messageKind === 'CHECKPOINT' ||
              Boolean(msg.supersededAt) ||
              Boolean(msg.clientApprovedAt)
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
                  {msg.messageKind === 'CHECKPOINT' ? (
                    <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-sanmarino">
                      Progress check
                    </p>
                  ) : null}
                  {msg.body.trim() ? <LinkifiedBody body={msg.body} /> : null}
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
                  />
                ) : null}
                {inlineApprovalFiles.length > 0
                  ? inlineApprovalFiles.map((file) => (
                      <ThreadApprovalCard
                        key={file.approvalItemId}
                        file={file}
                        onApprove={onApproveFile!}
                        onNeedsChanges={onNeedsChangesFile!}
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
        <form onSubmit={(e) => void onSubmit(e)} className="shrink-0 space-y-2 border-t border-chambray/10 pt-4">
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
            variant="portal"
            disabled={uploading}
            selectedIds={selectedAttachmentIds}
            pendingFiles={pendingFiles}
            onSelectedIdsChange={setSelectedAttachmentIds}
            onPendingFilesChange={setPendingFiles}
          />
          {error ? <p className="portal-alert-error">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
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
              className={btnPrimary}
            >
              {uploading ? 'Uploading…' : 'Send message'}
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
        <p className="shrink-0 text-sm text-app-muted">This conversation is closed ({request.status}).</p>
      ) : readOnly ? (
        <p className="shrink-0 text-sm text-app-muted">Archived conversation (read only).</p>
      ) : null}
    </div>
  )
}
