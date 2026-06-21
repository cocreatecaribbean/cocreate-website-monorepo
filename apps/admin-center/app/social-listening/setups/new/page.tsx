import { Suspense } from 'react'
import AdminPageHeader from '@/components/admin-page-header'
import SocialListeningAdminSetupForm from '@/components/social-listening-admin-setup-form'

export default function NewSetupPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Social Listening"
        title="Create listening setup"
        description="Configure keywords and platforms on behalf of a subscribed client."
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={<p className="text-sm text-app-muted">Loading…</p>}>
          <SocialListeningAdminSetupForm />
        </Suspense>
      </div>
    </main>
  )
}
