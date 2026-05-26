import AdminPageHeader from '@/components/admin-page-header'
import AdminProfileForm from '@/components/admin-profile-form'

export default function ProfilePage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        eyebrow="Account"
        title="Your profile"
        description="This is how clients see you on project timelines, messages, and status updates."
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <AdminProfileForm />
      </div>
    </main>
  )
}
