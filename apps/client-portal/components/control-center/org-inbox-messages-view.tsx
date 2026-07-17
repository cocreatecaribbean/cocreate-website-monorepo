'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import OrgInboxAttachmentComposer from '@/components/org-inbox-attachment-composer'
import ResizableMessageTextarea from '@cocreate/app-ui/resizable-message-textarea'
import { LinkifiedBody, RequestAttachments } from '@/lib/projects/thread-content'
import { canSendThreadMessage } from '@/lib/messaging/can-send-thread-message'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { ThreadScrollEnd } from '@cocreate/app-ui/scroll-to-latest'
import { queryKeys } from '@/lib/api/query-keys'
import {
  createOrgInboxConversation,
  fetchOrgInboxAttachmentDownloadUrl,
  fetchOrgInboxConversations,
  markOrgInboxRead,
  sendOrgInboxMessage,
  uploadOrgInboxFiles,
  type OrgInboxConversation,
  type OrgInboxMessage,
} from '@/lib/inbox/fetch-inbox-client'
import {
  createOptimisticInboxMessage,
  isPendingInboxMessage,
  replacePendingInboxMessage,
} from '@/lib/inbox/optimistic-inbox-message'
import { useClientInboxLive } from '@/lib/messaging/use-client-inbox-live'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import { bricolage_grot600 } from '@/styles/fonts'
import ThreadSummaryExport from '@cocreate/app-ui/thread-summary-export'
import {
  downloadOrgInboxThreadSummaryPdf,
  fetchOrgInboxAttachmentPreviewUrl,
  generateOrgInboxThreadSummary,
} from '@/lib/messaging/fetch-thread-summary'

export default function OrgInboxMessagesView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const conversationId = searchParams.get('conversationId')

  const { data: profile } = usePortalProfileQuery()
  const canManageTeam = Boolean(profile?.permissions.canManageOrgTeam)
  const canSendMessages = Boolean(
    profile?.permissions.canSendMessages ?? profile?.permissions.canAccessGetHelp,
  )

  const conversationsQuery = useQuery({
    queryKey: queryKeys.inbox.conversations(),
    queryFn: fetchOrgInboxConversations,
  })

  const conversations = conversationsQuery.data ?? []
  const [body, setBody] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (conversationId || conversations.length === 0) return
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    const orgWide = conversations.find((c) => c.visibility === 'ORG_WIDE')
    const pick = orgWide ?? conversations[0]!
    const params = new URLSearchParams(searchParams.toString())
    params.set(CONTROL_CENTER_VIEW_QUERY, 'messages')
    params.set('conversationId', pick.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [conversationId, conversations, pathname, router, searchParams])

  const inboxLive = useClientInboxLive(conversationId ?? undefined, {
    invalidateQueryKeys: [
      queryKeys.inbox.messages(conversationId ?? ''),
      queryKeys.inbox.conversations(),
      queryKeys.inbox.unreadCount(),
    ],
  })

  useEffect(() => {
    if (!conversationId) return
    void markOrgInboxRead(conversationId).then(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.unreadCount() })
    })
  }, [queryClient, conversationId])

  const messages = inboxLive.messages ?? []
  const { panelRef, endRef, notifyUserSent } = useThreadAutoScroll(messages, conversationId ?? '')
  const fetchDownloadUrl = useCallback(async (attachmentId: string) => {
    const url = await fetchOrgInboxAttachmentDownloadUrl(attachmentId)
    return url
      ? { url }
      : { url: null, error: 'Could not load file' }
  }, [])

  const sendMutation = useMutation({
    mutationFn: (payload: { body: string; attachmentIds?: string[] }) =>
      sendOrgInboxMessage(conversationId!, payload),
    onMutate: async (payload) => {
      if (!conversationId || !profile?.user) return
      const queryKey = queryKeys.inbox.messages(conversationId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<OrgInboxMessage[]>(queryKey)
      const optimistic = createOptimisticInboxMessage(conversationId, payload.body, {
        userId: profile.user.id,
        email: profile.user.email,
        role: 'CLIENT',
      })
      queryClient.setQueryData(queryKey, [...(previous ?? []), optimistic])
      setBody('')
      setPendingFiles([])
      notifyUserSent()
      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (serverMessage, _payload, context) => {
      if (!conversationId || !context) return
      const queryKey = queryKeys.inbox.messages(conversationId)
      queryClient.setQueryData<OrgInboxMessage[]>(queryKey, (current) =>
        replacePendingInboxMessage(current ?? [], context.optimisticId, serverMessage),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.conversations() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.unreadCount() })
    },
    onError: (err, payload, context) => {
      if (!conversationId || !context) return
      queryClient.setQueryData(queryKeys.inbox.messages(conversationId), context.previous)
      setBody(payload.body)
      setError(err instanceof Error ? err.message : 'Send failed')
    },
  })

  const selected = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId],
  )

  const selectConversation = (conversation: OrgInboxConversation) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(CONTROL_CENTER_VIEW_QUERY, 'messages')
    params.set('conversationId', conversation.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearConversation = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(CONTROL_CENTER_VIEW_QUERY, 'messages')
    params.delete('conversationId')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSendMessages) return
    if (
      !conversationId ||
      !canSendThreadMessage(body, [], pendingFiles, uploading || sendMutation.isPending)
    ) {
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

  const onCreateRestricted = async () => {
    if (!canManageTeam) return
    const subject = window.prompt('Conversation subject?')?.trim()
    if (!subject) return
    const created = await createOrgInboxConversation({
      visibility: 'RESTRICTED',
      subject,
      participantUserIds: [],
    })
    if (created) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all })
      selectConversation(created)
    }
  }

  const conversationLabel = (conversation: OrgInboxConversation) =>
    conversation.subject ??
    (conversation.visibility === 'ORG_WIDE' ? 'General inquiries' : 'Private')

  if (conversationsQuery.isLoading) {
    return <p className="text-sm text-app-muted">Loading messages…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="portal-eyebrow">Messages</p>
          <p className={`text-lg text-chambray ${bricolage_grot600.className}`}>
            Chat with CoCreate
          </p>
          <p className="mt-1 hidden text-sm text-app-muted sm:block">
            General questions about billing, timelines, or your account — not tied to a specific
            project thread.
          </p>
        </div>
        {canManageTeam ? (
          <button type="button" className="portal-btn-ghost" onClick={() => void onCreateRestricted()}>
            New private thread
          </button>
        ) : null}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-6">
        <ul
          className={`portal-glass-card divide-y divide-chambray/6 overflow-hidden ${
            conversationId ? 'hidden lg:block' : ''
          }`}
        >
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => selectConversation(conversation)}
                className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                  conversationId === conversation.id ? 'bg-sanmarino/10' : 'hover:bg-chambray/5'
                }`}
              >
                <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                  {conversationLabel(conversation)}
                </p>
                {(conversation.unreadCount ?? 0) > 0 ? (
                  <span className="text-xs text-sanmarino">{conversation.unreadCount} new</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        {conversationId ? (
          <section className="portal-glass-card portal-thread-surface flex h-[min(calc(100dvh-10rem),640px)] min-h-[320px] flex-col lg:h-[min(calc(100dvh-12rem),720px)]">
            <div className="portal-thread-surface-header">
              <button
                type="button"
                onClick={clearConversation}
                className={`mb-2 inline-flex min-h-10 items-center gap-2 text-sm text-sanmarino hover:text-chambray lg:hidden ${bricolage_grot600.className}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to threads
              </button>
              {selected ? (
                <div className="flex items-start justify-between gap-3">
                  <p className={`min-w-0 flex-1 text-sm text-chambray ${bricolage_grot600.className}`}>
                    {conversationLabel(selected)}
                  </p>
                  <ThreadSummaryExport
                    fetchAttachmentDownloadUrl={fetchOrgInboxAttachmentPreviewUrl}
                    onGenerate={(options) =>
                      generateOrgInboxThreadSummary(selected.id, options)
                    }
                    onExportPdf={(options) =>
                      downloadOrgInboxThreadSummaryPdf(selected.id, options)
                    }
                  />
                </div>
              ) : null}
            </div>
            {selected ? (
              <div className="portal-message-thread-shell flex min-h-0 flex-1 flex-col md:mt-4">
                <div ref={panelRef} className="portal-thread-panel">
                  {inboxLive.isLoading ? (
                    <p className="text-sm text-app-muted">Loading…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-app-muted">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.authorRole === 'CLIENT'
                      return (
                        <div
                          key={msg.id}
                          className={`mb-3 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <p className="text-[0.65rem] text-app-muted">
                            {isMine ? 'You' : msg.authorEmail} ·{' '}
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                          {msg.body.trim() ? (
                            <div
                              className={`mt-1 max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                                isMine ? 'portal-msg-mine' : 'portal-msg-theirs'
                              } ${isPendingInboxMessage(msg.id) ? 'opacity-80' : ''} ${bricolage_grot600.className}`}
                            >
                              <LinkifiedBody body={msg.body} />
                            </div>
                          ) : null}
                          {msg.attachments?.length ? (
                            <RequestAttachments
                              attachments={msg.attachments}
                              fetchDownloadUrl={fetchDownloadUrl}
                              variant="portal"
                              showHeading={false}
                              className={`mt-2 max-w-[90%] ${isMine ? 'self-end' : 'self-start'}`}
                            />
                          ) : null}
                        </div>
                      )
                    })
                  )}
                  <ThreadScrollEnd ref={endRef} />
                </div>
                {error ? (
                  <p className="shrink-0 px-3 text-sm text-red-600 md:px-0" role="alert">
                    {error}
                  </p>
                ) : null}
                {canSendMessages ? (
                  <form
                    onSubmit={(e) => void onSubmit(e)}
                    className="portal-thread-composer shrink-0 space-y-2 border-t border-chambray/10 pt-4"
                  >
                    <ResizableMessageTextarea
                      storageKey="portal-org-inbox-composer"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write a message…"
                      className="portal-textarea w-full text-sm"
                    />
                    <div className="portal-thread-composer-toolbar flex flex-wrap items-center gap-2">
                      <OrgInboxAttachmentComposer
                        disabled={uploading || sendMutation.isPending}
                        pendingFiles={pendingFiles}
                        onPendingFilesChange={setPendingFiles}
                        toolbar
                      />
                      <button
                        type="submit"
                        disabled={
                          !canSendThreadMessage(
                            body,
                            [],
                            pendingFiles,
                            uploading || sendMutation.isPending,
                          )
                        }
                        className="portal-btn-primary ml-auto"
                      >
                        {uploading ? 'Uploading…' : 'Send'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="shrink-0 border-t border-chambray/10 pt-4 text-sm text-app-muted">
                    You can view this conversation, but only Admins and Contributors can send
                    messages.
                  </p>
                )}
              </div>
            ) : (
              <p className="p-4 text-sm text-app-muted md:p-0">This thread could not be found.</p>
            )}
          </section>
        ) : (
          <p className="hidden text-sm text-app-muted lg:block">Select a conversation.</p>
        )}
      </div>
    </div>
  )
}
