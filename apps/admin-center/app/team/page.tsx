import AdminPageHeader from '@/components/admin-page-header'
import AgencyAdminsManager from '@/components/agency-admins-manager'
import AgencyCollaboratorsManager from '@/components/agency-collaborators-manager'

export default function TeamPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="CoCreate agency"
        title="Team & admin access"
        description="Manage core admins and freelance collaborators. Clients are managed separately under Clients."
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <div className="space-y-10">
          <AgencyAdminsManager />
          <AgencyCollaboratorsManager />
        </div>
      </div>
    </main>
  )
}
