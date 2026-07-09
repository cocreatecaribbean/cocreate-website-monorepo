'use client'

import { useState } from 'react'
import AdminPageHeader from '@/components/admin-page-header'
import AdminToast from '@/components/admin-toast'
import ClientsListView from '@/components/clients-list-view'
import InviteClientModal from '@/components/invite-client-modal'

export default function ClientsPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Clients"
        title="Clients"
        description="Client organizations, portal access, and brand assets."
        action={
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="admin-btn-primary text-sm"
          >
            Invite client
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        {success ? (
          <AdminToast
            message={success}
            variant="success"
            onDismiss={() => setSuccess(null)}
          />
        ) : null}
        <ClientsListView />
      </div>

      <InviteClientModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(message) => {
          setSuccess(message)
          setInviteOpen(false)
        }}
      />
    </main>
  )
}
