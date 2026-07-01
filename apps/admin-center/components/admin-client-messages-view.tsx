'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import AdminOrgInboxConversationList from '@/components/admin-org-inbox-conversation-list'
import AdminOrgInboxThreadView from '@/components/admin-org-inbox-thread-view'

type AdminClientMessagesViewProps = {
  organizationId: string
}

export default function AdminClientMessagesView({
  organizationId,
}: AdminClientMessagesViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversationId')

  const updateConversationId = (nextConversationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (pathname.startsWith('/messages')) {
      params.set('organizationId', organizationId)
    } else if (pathname.startsWith('/clients/')) {
      params.set('tab', 'messages')
    }

    if (nextConversationId) {
      params.set('conversationId', nextConversationId)
    } else {
      params.delete('conversationId')
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className={`space-y-4 ${conversationId ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : ''}`}>
      <p className={`text-sm text-app-muted ${conversationId ? 'shrink-0' : ''}`}>
        General org chat with this client (not project approval threads — see Inbox).
      </p>
      <div
        className={`lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-6 ${
          conversationId ? 'flex min-h-0 flex-1 flex-col lg:grid' : ''
        }`}
      >
        <div className={conversationId ? 'hidden lg:block' : ''}>
          <AdminOrgInboxConversationList
            organizationId={organizationId}
            onSelectConversation={(id) => updateConversationId(id)}
          />
        </div>
        {conversationId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <AdminOrgInboxThreadView
              organizationId={organizationId}
              conversationId={conversationId}
              onBack={() => updateConversationId(null)}
            />
          </div>
        ) : (
          <p className="hidden text-sm text-app-muted lg:block">Select a thread to read and reply.</p>
        )}
      </div>
    </div>
  )
}
