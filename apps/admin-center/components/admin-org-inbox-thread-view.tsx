'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { LinkifiedBody } from '@/lib/projects/thread-content'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  fetchAdminOrgInboxConversationsForClient,
  fetchAdminOrgInboxMessages,
  markAdminOrgInboxRead,
  sendAdminOrgInboxMessage,
} from '@/lib/inbox/fetch-org-inbox-admin'
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

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendAdminOrgInboxMessage(conversationId, text),
    onSuccess: () => {
      setBody('')
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.orgInbox.all })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Send failed')
    },
  })

  const messages = messagesQuery.data ?? []
  const { panelRef } = useThreadAutoScroll(messages, conversationId)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return
    setError(null)
    void sendMutation.mutateAsync(body.trim())
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
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray lg:hidden ${bricolage_grot600.className}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to threads
      </button>

      <section className="admin-glass-card flex min-h-[360px] flex-col p-4">
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
        <div ref={panelRef} className="mt-4 flex-1 space-y-3 overflow-y-auto">
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
                }`}
              >
                <p className="text-xs text-app-muted">
                  {msg.authorEmail} · {new Date(msg.createdAt).toLocaleString()}
                </p>
                <LinkifiedBody body={msg.body} />
              </div>
            ))
          )}
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={onSubmit} className="mt-4 flex gap-2 border-t pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="admin-input flex-1 text-sm"
            placeholder="Reply to client…"
          />
          <button type="submit" className="admin-btn-primary self-end">
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
