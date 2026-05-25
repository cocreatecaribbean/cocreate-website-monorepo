import AdminPageHeader from '@/components/admin-page-header'
import AgencyAdminsManager from '@/components/agency-admins-manager'

export default function TeamPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        eyebrow="CoCreate agency"
        title="Team & admin access"
        description="Authorize who can sign in to the Admin Center. Clients are managed separately under Clients."
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <AgencyAdminsManager />
      </div>
    </main>
  )
}
