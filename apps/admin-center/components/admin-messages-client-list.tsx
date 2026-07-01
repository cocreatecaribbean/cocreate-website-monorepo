'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'

import { useClientsQuery } from '@/lib/api/queries/clients'
import { useAdminOrgInboxConversationsQuery } from '@/lib/api/queries/org-inbox'
import type { ClientOrganizationRosterItem } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'

const EMPTY_CLIENTS: ClientOrganizationRosterItem[] = []

function ClientAvatar({ client }: { client: ClientOrganizationRosterItem }) {
  if (client.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={client.logoUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-contain"
      />
    )
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sanmarino/20 to-chambray/10 text-xs font-semibold text-chambray ring-1 ring-sanmarino/15">
      {client.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?'}
    </span>
  )
}

export default function AdminMessagesClientList() {
  const clientsQuery = useClientsQuery()
  const conversationsQuery = useAdminOrgInboxConversationsQuery()

  const clients = clientsQuery.data ?? EMPTY_CLIENTS

  const unreadByOrgId = useMemo(() => {
    const map = new Map<string, number>()
    for (const conversation of conversationsQuery.data ?? []) {
      const count = conversation.unreadCount ?? 0
      if (count <= 0) continue
      map.set(
        conversation.organizationId,
        (map.get(conversation.organizationId) ?? 0) + count,
      )
    }
    return map
  }, [conversationsQuery.data])

  if (clientsQuery.isLoading) {
    return <p className="text-sm text-app-muted">Loading clients…</p>
  }

  if (clients.length === 0) {
    return (
      <div className="admin-glass-card p-6">
        <p className="text-sm text-app-muted">No clients onboarded yet.</p>
        <Link href="/client-access" className="mt-3 inline-block text-sm text-sanmarino hover:text-chambray">
          Go to Client Access
        </Link>
      </div>
    )
  }

  return (
    <ul className="admin-glass-card divide-y divide-chambray/6 overflow-hidden">
      {clients.map((client) => {
        const unreadCount = unreadByOrgId.get(client.id) ?? 0
        return (
          <li key={client.id}>
            <Link
              href={`/messages?organizationId=${encodeURIComponent(client.id)}`}
              className="flex items-center gap-3 px-4 py-4 transition hover:bg-chambray/5"
            >
              <ClientAvatar client={client} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm text-chambray ${bricolage_grot600.className}`}>
                  {client.name}
                </p>
                <p className="truncate text-xs text-app-muted">
                  {client.primaryContact?.email ?? 'No contact'}
                </p>
              </div>
              {unreadCount > 0 ? (
                <span className="shrink-0 rounded-full bg-sanmarino px-2 py-0.5 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              ) : null}
              <ChevronRight className="h-4 w-4 shrink-0 text-app-muted" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
