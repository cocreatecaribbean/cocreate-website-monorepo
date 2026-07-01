'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { LinkifiedBody } from '@/lib/projects/thread-content'
import { useThreadAutoScroll } from '@/lib/projects/use-thread-auto-scroll'
import { queryKeys } from '@/lib/api/query-keys'
import {
  createOrgInboxConversation,
  fetchOrgInboxConversations,
  fetchOrgInboxMessages,
  markOrgInboxRead,
  sendOrgInboxMessage,
  type OrgInboxConversation,
} from '@/lib/inbox/fetch-inbox-client'
import { useOrgInboxRealtime } from '@/lib/inbox/use-org-inbox-realtime'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import { bricolage_grot600 } from '@/styles/fonts'

export default function OrgInboxMessagesView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const conversationId = searchParams.get('conversationId')

  const { data: profile } = usePortalProfileQuery()
  const canManageTeam = Boolean(profile?.permissions.canManageOrgTeam)

  const conversationsQuery = useQuery({
    queryKey: queryKeys.inbox.conversations(),
    queryFn: fetchOrgInboxConversations,
  })

  const conversations = conversationsQuery.data ?? []
  const [body, setBody] = useState('')
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

  const messagesQuery = useQuery({
    queryKey: queryKeys.inbox.messages(conversationId ?? ''),
    queryFn: () => fetchOrgInboxMessages(conversationId!),
    enabled: Boolean(conversationId),
  })

  useOrgInboxRealtime(conversationId ?? undefined, [
    queryKeys.inbox.messages(conversationId ?? ''),
    queryKeys.inbox.conversations(),
    queryKeys.inbox.unreadCount(),
  ])

  useEffect(() => {
    if (!conversationId) return
    void markOrgInboxRead(conversationId).then(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.unreadCount() })
    })
  }, [queryClient, conversationId])

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendOrgInboxMessage(conversationId!, text),
    onSuccess: () => {
      setBody('')
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Send failed'),
  })

  const messages = messagesQuery.data ?? []
  const { panelRef, scrollToBottom } = useThreadAutoScroll(messages, conversationId ?? '')
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
    if (!conversationId || !body.trim()) return
    setError(null)
    await sendMutation.mutateAsync(body.trim())
    scrollToBottom()
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
          <section className="portal-glass-card flex min-h-[min(70vh,520px)] flex-col p-4 sm:min-h-[420px] sm:p-6">
            <button
              type="button"
              onClick={clearConversation}
              className={`mb-3 inline-flex min-h-10 items-center gap-2 text-sm text-sanmarino hover:text-chambray lg:hidden ${bricolage_grot600.className}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to threads
            </button>
            {selected ? (
              <>
                <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                  {conversationLabel(selected)}
                </p>
                <div ref={panelRef} className="portal-thread-panel mt-4 flex-1">
                  {messagesQuery.isLoading ? (
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
                          <div
                            className={`mt-1 max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                              isMine
                                ? 'bg-sanmarino/15 text-chambray'
                                : 'bg-black/5 dark:bg-white/5'
                            }`}
                          >
                            <LinkifiedBody body={msg.body} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                {error ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <form onSubmit={onSubmit} className="mt-4 flex gap-2 border-t border-chambray/10 pt-4">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={2}
                    placeholder="Write a message…"
                    className="portal-input min-h-[44px] flex-1 resize-y text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!body.trim() || sendMutation.isPending}
                    className="portal-btn-primary shrink-0 self-end"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-app-muted">This thread could not be found.</p>
            )}
          </section>
        ) : (
          <p className="hidden text-sm text-app-muted lg:block">Select a conversation.</p>
        )}
      </div>
    </div>
  )
}
