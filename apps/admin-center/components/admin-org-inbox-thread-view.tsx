'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { useAdminSession } from '@/components/admin-session-provider'
import OrgInboxAttachmentComposer from '@/components/org-inbox-attachment-composer'
import { LinkifiedBody, RequestAttachments } from '@/lib/projects/thread-content'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { ThreadScrollEnd } from '@cocreate/app-ui/scroll-to-latest'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  fetchOrgInboxAttachmentDownloadUrl,
  fetchAdminOrgInboxConversationsForClient,
  markAdminOrgInboxRead,
  sendAdminOrgInboxMessage,
  uploadOrgInboxFiles,
  type OrgInboxMessage,
} from '@/lib/inbox/fetch-org-inbox-admin'
import {
  createOptimisticInboxMessage,
  isPendingInboxMessage,
  replacePendingInboxMessage,
} from '@/lib/inbox/optimistic-inbox-message'
import { useAdminInboxLive } from '@/lib/messaging/use-admin-inbox-live'
import {
  conversationSubject,
  formatConversationDate,
} from '@/lib/inbox/org-inbox-display'
import { bricolage_grot600 } from '@/styles/fonts'
import ThreadSummaryExport from '@cocreate/app-ui/thread-summary-export'
import {
  downloadAdminOrgInboxThreadSummaryPdf,
  generateAdminOrgInboxThreadSummary,
} from '@/lib/api/mutations/thread-summary'

type AdminOrgInboxThreadViewProps = {
  organizationId: string
  conversationId: string
  onBack: () => void
}

export default function AdminOrgInboxThreadView({
  organizationId,
  conversationId,
  onBack,
}: AdminOrgInboxThreadViewProps) {
  const queryClient = useQueryClient()
  const { session } = useAdminSession()
  const [body, setBody] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const conversationsQuery = useQuery({
    queryKey: adminQueryKeys.orgInbox.orgConversations(organizationId),
    queryFn: () => fetchAdminOrgInboxConversationsForClient(organizationId),
  })

  const conversation = useMemo(
    () => conversationsQuery.data?.find((c) => c.id === conversationId) ?? null,
    [conversationsQuery.data, conversationId],
  )

  const inboxLive = useAdminInboxLive(conversationId, {
    invalidateQueryKeys: [
      adminQueryKeys.orgInbox.messages(conversationId),
      adminQueryKeys.orgInbox.unreadCount(),
      adminQueryKeys.orgInbox.orgConversations(organizationId),
      adminQueryKeys.orgInbox.conversations(),
    ],
  })

  const messages = inboxLive.messages ?? []

  useEffect(() => {
    void markAdminOrgInboxRead(conversationId).then(() => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.orgInbox.unreadCount() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.orgInbox.orgConversations(organizationId),
      })
    })
  }, [conversationId, organizationId, queryClient])

  const { panelRef, endRef, notifyUserSent } = useThreadAutoScroll(messages, conversationId)
  const fetchDownloadUrl = useCallback(
    (attachmentId: string) => fetchOrgInboxAttachmentDownloadUrl(attachmentId),
    [],
  )

  const sendMutation = useMutation({
    mutationFn: (payload: { body: string; attachmentIds?: string[] }) =>
      sendAdminOrgInboxMessage(conversationId, payload),
    onMutate: async (payload) => {
      if (session?.mode !== 'user' || !session.userId || !session.email) return
      const queryKey = adminQueryKeys.orgInbox.messages(conversationId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<OrgInboxMessage[]>(queryKey)
      const optimistic = createOptimisticInboxMessage(conversationId, payload.body, {
        userId: session.userId,
        email: session.email,
        role: 'ADMIN',
      })
      queryClient.setQueryData(queryKey, [...(previous ?? []), optimistic])
      setBody('')
      setPendingFiles([])
      notifyUserSent()
      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (serverMessage, _payload, context) => {
      if (!context) return
      const queryKey = adminQueryKeys.orgInbox.messages(conversationId)
      queryClient.setQueryData<OrgInboxMessage[]>(queryKey, (current) =>
        replacePendingInboxMessage(current ?? [], context.optimisticId, serverMessage),
      )
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.orgInbox.conversations() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.orgInbox.orgConversations(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.orgInbox.unreadCount() })
    },
    onError: (err, payload, context) => {
      if (!context) return
      queryClient.setQueryData(
        adminQueryKeys.orgInbox.messages(conversationId),
        context.previous,
      )
      setBody(payload.body)
      setError(err instanceof Error ? err.message : 'Send failed')
    },
  })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSendThreadMessage(body, [], pendingFiles, uploading || sendMutation.isPending)) {
      return
    }
    setError(null)
    setUploading(true)
    try {
      const uploaded = await uploadOrgInboxFiles(conversationId, pendingFiles)
      if (!uploaded.ok) {
        setError(uploaded.message ?? 'Could not upload attachments')
        return
      }
      await sendMutation.mutateAsync({
        body: body.trim(),
        attachmentIds: uploaded.attachmentIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setUploading(false)
    }
  }

  if (conversationsQuery.isLoading || inboxLive.isLoading) {
    return <p className="text-sm text-app-muted">Loading thread…</p>
  }

  if (!conversation) {
    return (
      <div className="admin-glass-card p-6">
        <p className="text-sm text-app-muted">This thread could not be found.</p>
        <button type="button" className="admin-btn-ghost mt-4 text-sm" onClick={onBack}>
          Back to threads
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex shrink-0 items-center gap-2 text-sm text-sanmarino hover:text-chambray lg:hidden ${bricolage_grot600.className}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to threads
      </button>

      <section className="admin-glass-card admin-message-thread-shell mx-auto flex h-[min(calc(100dvh-11rem),680px)] min-h-[360px] w-full max-w-2xl flex-col p-4">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-sm ${bricolage_grot600.className}`}>
              {conversationSubject(conversation)}
            </p>
            <p className="mt-1 text-xs text-app-muted">
              {conversation.createdByEmail
                ? `Started by ${conversation.createdByEmail}`
                : 'Started by client'}
              {' · '}
              {formatConversationDate(conversation.createdAt)}
            </p>
          </div>
          <ThreadSummaryExport
            triggerClassName="admin-btn-ghost shrink-0 px-3 py-1.5 text-xs"
            panelClassName="admin-glass-card"
            primaryButtonClassName="admin-btn-primary px-4 py-2 text-sm"
            ghostButtonClassName="admin-btn-ghost px-4 py-2 text-sm"
            fetchAttachmentDownloadUrl={fetchOrgInboxAttachmentDownloadUrl}
            onGenerate={(options) =>
              generateAdminOrgInboxThreadSummary(conversationId, options)
            }
            onExportPdf={(options) =>
              downloadAdminOrgInboxThreadSummaryPdf(conversationId, options)
            }
          />
        </div>
        <div ref={panelRef} className="admin-thread-panel mt-4">
          {messages.length === 0 ? (
            <p className="text-sm text-app-muted">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex flex-col ${
                  msg.authorRole === 'ADMIN' ? 'items-end' : 'items-start'
                }`}
              >
                <p className="text-xs text-app-muted">
                  {msg.authorEmail} · {new Date(msg.createdAt).toLocaleString()}
                </p>
                {msg.body.trim() ? (
                  <div
                    className={`mt-1 max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.authorRole === 'ADMIN'
                        ? 'bg-sanmarino/15'
                        : 'bg-chambray/8'
                    } ${isPendingInboxMessage(msg.id) ? 'opacity-80' : ''}`}
                  >
                    <LinkifiedBody body={msg.body} />
                  </div>
                ) : null}
                {msg.attachments?.length ? (
                  <RequestAttachments
                    attachments={msg.attachments}
                    fetchDownloadUrl={fetchDownloadUrl}
                    variant="admin"
                    showHeading={false}
                    className={`mt-2 max-w-[85%] ${
                      msg.authorRole === 'ADMIN' ? 'self-end' : 'self-start'
                    }`}
                  />
                ) : null}
              </div>
            ))
          )}
          <ThreadScrollEnd ref={endRef} />
        </div>
        {error ? <p className="mt-2 shrink-0 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 shrink-0 space-y-2 border-t pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="admin-input w-full text-sm"
            placeholder="Reply to client…"
          />
          <OrgInboxAttachmentComposer
            disabled={uploading || sendMutation.isPending}
            pendingFiles={pendingFiles}
            onPendingFilesChange={setPendingFiles}
          />
          <button
            type="submit"
            disabled={
              !canSendThreadMessage(body, [], pendingFiles, uploading || sendMutation.isPending)
            }
            className="admin-btn-primary"
          >
            {uploading ? 'Uploading…' : 'Send'}
          </button>
        </form>
      </section>
    </>
  )
}
