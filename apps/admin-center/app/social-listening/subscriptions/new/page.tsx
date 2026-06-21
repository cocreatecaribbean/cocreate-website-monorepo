import AdminPageHeader from '@/components/admin-page-header'
import SocialListeningGrantForm from '@/components/social-listening-grant-form'

export default function GrantSubscriptionPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Social Listening"
        title="Grant subscription"
        description="Grant complimentary or offline-paid access without Fygaro checkout."
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <SocialListeningGrantForm />
      </div>
    </main>
  )
}
