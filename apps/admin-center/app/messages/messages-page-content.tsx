'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import AdminClientMessagesView from '@/components/admin-client-messages-view'
import AdminMessagesClientList from '@/components/admin-messages-client-list'
import AdminPageHeader from '@/components/admin-page-header'
import { useClientDetailQuery } from '@/lib/api/queries/clients'
import { bricolage_grot600 } from '@/styles/fonts'

export default function AdminMessagesPageContent() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  const clientQuery = useClientDetailQuery(organizationId ?? '')
  const clientName = clientQuery.data?.name

  if (!organizationId) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AdminPageHeader
          eyebrow="Messages"
          title="Messages"
          description="Choose a client to view general inquiries."
        />
        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
          <AdminMessagesClientList />
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Messages"
        title={clientName ?? 'Client messages'}
        description={
          clientName
            ? `General org chat with ${clientName}.`
            : 'General org chat with this client.'
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <Link
          href="/messages"
          className={`mb-5 inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray ${bricolage_grot600.className}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All clients
        </Link>
        <AdminClientMessagesView organizationId={organizationId} />
      </div>
    </main>
  )
}
