import AdminPageHeader from '@/components/admin-page-header'
import SocialListeningSubscriptionDetail from '@/components/social-listening-subscription-detail'

type PageProps = { params: Promise<{ organizationId: string }> }

export default async function SocialListeningSubscriptionPage({ params }: PageProps) {
  const { organizationId } = await params

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Social Listening"
        title="Subscription detail"
        description="Manage subscription, billing, setups, and payment history."
      />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <SocialListeningSubscriptionDetail organizationId={organizationId} />
      </div>
    </main>
  )
}
