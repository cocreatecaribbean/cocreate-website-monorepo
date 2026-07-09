'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'

import {
  AdminApiFetchError,
  adminFetchErrorHint,
} from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { fetchAdminOrgInboxConversationsForClient } from '@/lib/inbox/fetch-org-inbox-admin'
import {
  conversationSubject,
  formatConversationDate,
} from '@/lib/inbox/org-inbox-display'
import { bricolage_grot600 } from '@/styles/fonts'

type AdminOrgInboxConversationListProps = {
  organizationId: string
  onSelectConversation: (conversationId: string) => void
}

export default function AdminOrgInboxConversationList({
  organizationId,
  onSelectConversation,
}: AdminOrgInboxConversationListProps) {
  const conversationsQuery = useQuery({
    queryKey: adminQueryKeys.orgInbox.orgConversations(organizationId),
    queryFn: () => fetchAdminOrgInboxConversationsForClient(organizationId),
    refetchInterval: 15_000,
  })

  if (conversationsQuery.isLoading) {
    return <p className="text-sm text-app-muted">Loading threads…</p>
  }

  if (conversationsQuery.isError) {
    const err = conversationsQuery.error
    const hint =
      err instanceof AdminApiFetchError ? adminFetchErrorHint(err.code) : null
    return (
      <div className="admin-glass-card p-6">
        <p className="text-sm text-red-600">
          {err instanceof Error ? err.message : 'Could not load message threads.'}
        </p>
        {hint ? <p className="mt-2 text-sm text-app-muted">{hint}</p> : null}
        <button
          type="button"
          className="admin-btn-ghost mt-4 text-sm"
          onClick={() => void conversationsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  const conversations = conversationsQuery.data ?? []

  if (conversations.length === 0) {
    return (
      <div className="admin-glass-card p-6">
        <p className="text-sm text-app-muted">
          No message threads yet. The default thread should appear automatically — try again.
        </p>
        <button
          type="button"
          className="admin-btn-ghost mt-4 text-sm"
          onClick={() => void conversationsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ul className="admin-glass-card divide-y divide-chambray/6 overflow-hidden">
      {conversations.map((conversation) => {
        const unreadCount = conversation.unreadCount ?? 0
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-chambray/5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                    {conversationSubject(conversation)}
                  </p>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-sanmarino px-2 py-0.5 text-xs font-medium text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>
                {conversation.lastMessagePreview ? (
                  <p className="mt-1 truncate text-sm text-app-muted">
                    {conversation.lastMessagePreview}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-app-muted">No messages yet</p>
                )}
                <p className="mt-2 text-xs text-app-muted">
                  {conversation.createdByEmail
                    ? `Started by ${conversation.createdByEmail}`
                    : 'Started by client'}
                  {' · '}
                  Last activity {formatConversationDate(conversation.updatedAt)}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-app-muted" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
