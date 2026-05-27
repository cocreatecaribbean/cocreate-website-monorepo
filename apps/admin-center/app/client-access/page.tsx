import { Plus } from 'lucide-react'
import AdminPageHeader from '@/components/admin-page-header'
import ClientAccessManager from '@/components/client-access-manager'

export default function ClientAccessPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Clients"
        title="Client portal access"
        description="Only emails listed here can sign in from the public site&apos;s Client Portal menu."
      />

      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <ClientAccessManager />
      </div>
    </main>
  )
}
