'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { useAdminSession } from '@/components/admin-session-provider'
import { LinkifiedBody } from '@/lib/projects/thread-content'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  fetchAdminOrgInboxConversationsForClient,
  fetchAdminOrgInboxMessages,
  markAdminOrgInboxRead,
  sendAdminOrgInboxMessage,
  type OrgInboxMessage,
} from '@/lib/inbox/fetch-org-inbox-admin'
import {
  createOptimisticInboxMessage,
  isPendingInboxMessage,
  replacePendingInboxMessage,
} from '@/lib/inbox/optimistic-inbox-message'
import { useAdminOrgInboxRealtime } from '@/lib/inbox/use-org-inbox-realtime-admin'
import {
  conversationSubject,
  formatConversationDate,
} from '@/lib/inbox/org-inbox-display'
import { bricolage_grot600 } from '@/styles/fonts'

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
  const [error, setError] = useState<string | null>(null)

  const conversationsQuery = useQuery({
    queryKey: adminQueryKeys.orgInbox.orgConversations(organizationId),
    queryFn: () => fetchAdminOrgInboxConversationsForClient(organizationId),
  })

  const conversation = useMemo(
    () => conversationsQuery.data?.find((c) => c.id === conversationId) ?? null,
    [conversationsQuery.data, conversationId],
  )

  const messagesQuery = useQuery({
    queryKey: adminQueryKeys.orgInbox.messages(conversationId),
    queryFn: () => fetchAdminOrgInboxMessages(conversationId),
    enabled: Boolean(conversationId),
  })

  useAdminOrgInboxRealtime(conversationId, [
    adminQueryKeys.orgInbox.messages(conversationId),
    adminQueryKeys.orgInbox.unreadCount(),
    adminQueryKeys.orgInbox.orgConversations(organizationId),
    adminQueryKeys.orgInbox.conversations(),
  ])

  useEffect(() => {
    void markAdminOrgInboxRead(conversationId).then(() => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.orgInbox.all })
    })
  }, [conversationId, queryClient])

  const messages = messagesQuery.data ?? []
  const { panelRef, scrollToBottom } = useThreadAutoScroll(messages, conversationId)

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendAdminOrgInboxMessage(conversationId, text),
    onMutate: async (text) => {
      if (session?.mode !== 'user' || !session.userId || !session.email) return
      const queryKey = adminQueryKeys.orgInbox.messages(conversationId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<OrgInboxMessage[]>(queryKey)
      const optimistic = createOptimisticInboxMessage(conversationId, text, {
        userId: session.userId,
        email: session.email,
        role: 'ADMIN',
      })
      queryClient.setQueryData(queryKey, [...(previous ?? []), optimistic])
      setBody('')
      scrollToBottom(true)
      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (serverMessage, _text, context) => {
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
    onError: (err, text, context) => {
      if (!context) return
      queryClient.setQueryData(
        adminQueryKeys.orgInbox.messages(conversationId),
        context.previous,
      )
      setBody(text)
      setError(err instanceof Error ? err.message : 'Send failed')
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return
    setError(null)
    sendMutation.mutate(body.trim())
  }

  if (conversationsQuery.isLoading || messagesQuery.isLoading) {
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

      <section className="admin-glass-card admin-message-thread-shell flex h-[min(calc(100dvh-11rem),680px)] min-h-[360px] flex-col p-4">
        <p className={`shrink-0 text-sm ${bricolage_grot600.className}`}>
          {conversationSubject(conversation)}
        </p>
        <p className="mt-1 shrink-0 text-xs text-app-muted">
          {conversation.createdByEmail
            ? `Started by ${conversation.createdByEmail}`
            : 'Started by client'}
          {' · '}
          {formatConversationDate(conversation.createdAt)}
        </p>
        <div ref={panelRef} className="admin-thread-panel mt-4">
          {messages.length === 0 ? (
            <p className="text-sm text-app-muted">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.authorRole === 'ADMIN'
                    ? 'ml-auto bg-sanmarino/15'
                    : 'bg-chambray/8'
                } ${isPendingInboxMessage(msg.id) ? 'opacity-80' : ''}`}
              >
                <p className="text-xs text-app-muted">
                  {msg.authorEmail} · {new Date(msg.createdAt).toLocaleString()}
                </p>
                <LinkifiedBody body={msg.body} />
              </div>
            ))
          )}
        </div>
        {error ? <p className="mt-2 shrink-0 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={onSubmit} className="mt-4 flex shrink-0 gap-2 border-t pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="admin-input flex-1 text-sm"
            placeholder="Reply to client…"
          />
          <button type="submit" disabled={!body.trim()} className="admin-btn-primary self-end">
            Send
          </button>
        </form>
      </section>
    </>
  )
}
