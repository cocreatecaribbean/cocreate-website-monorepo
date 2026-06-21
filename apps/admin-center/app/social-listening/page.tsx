import AdminPageHeader from '@/components/admin-page-header'
import SocialListeningCenter from '@/components/social-listening-center'

export default function SocialListeningPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Operations"
        title="Social Listening Center"
        description="Manage subscriptions, billing lifecycle, and agency-managed listening setups."
      />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <SocialListeningCenter />
      </div>
    </main>
  )
}
