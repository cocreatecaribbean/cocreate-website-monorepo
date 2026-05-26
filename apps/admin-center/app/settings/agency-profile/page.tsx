import AdminPageHeader from '@/components/admin-page-header'
import AgencyProfileOptionsManager from '@/components/agency-profile-options-manager'
import SuperAdminGate from '@/components/super-admin-gate'

export default function AgencyProfileSettingsPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        eyebrow="Super admin"
        title="Profile options"
        description="Add or remove job titles for the agency. Admins can select multiple titles on their profile. Clients see name and titles on project actions."
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <SuperAdminGate>
          <AgencyProfileOptionsManager />
        </SuperAdminGate>
      </div>
    </main>
  )
}
