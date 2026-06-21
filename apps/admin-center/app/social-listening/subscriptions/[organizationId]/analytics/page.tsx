import Link from 'next/link'
import AdminPageHeader from '@/components/admin-page-header'
import SocialListeningAdminAnalyticsView from '@/components/social-listening-admin-analytics-view'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { adminApiBase } from '@/lib/admin-api-proxy'
import { fetchAdminSocialListeningAnalytics } from '@/lib/social-listening/fetch-admin-analytics-server'
import { bricolage_grot500 } from '@/styles/fonts'

type PageProps = { params: Promise<{ organizationId: string }> }

type SubscriptionDetailResponse = {
  subscription: {
    organization: { id: string; name: string; slug: string }
  } | null
}

export default async function SocialListeningAnalyticsPage({ params }: PageProps) {
  const { organizationId } = await params
  const headers = await adminApiHeaders(false)

  const [initialAnalytics, subscriptionDetail] = await Promise.all([
    fetchAdminSocialListeningAnalytics(organizationId),
    headers
      ? fetch(`${adminApiBase()}/admin/social-listening/subscriptions/${organizationId}`, {
          headers,
          cache: 'no-store',
        })
          .then((response) =>
            response.ok ? (response.json() as Promise<SubscriptionDetailResponse>) : null,
          )
          .catch(() => null)
      : Promise.resolve(null),
  ])

  const organizationName =
    subscriptionDetail?.subscription?.organization?.name?.trim() || 'Client organization'

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminPageHeader
        eyebrow="Social Listening"
        title="Analytics"
        description={`Same dashboard as the client portal for ${organizationName}.`}
        action={
          <Link
            href={`/social-listening/subscriptions/${organizationId}`}
            className="admin-btn-ghost inline-flex min-h-10 items-center px-4"
          >
            Back to subscription
          </Link>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        {!initialAnalytics ? (
          <div className="admin-surface rounded-2xl p-6">
            <p className={`text-sm text-app-muted ${bricolage_grot500.className}`}>
              Unable to load analytics. Confirm the organization has an active Social Listening
              subscription and at least one captured snapshot, then try again.
            </p>
            <Link
              href={`/social-listening/subscriptions/${organizationId}`}
              className="admin-btn-primary mt-4 inline-flex min-h-10 items-center px-4"
            >
              View subscription
            </Link>
          </div>
        ) : (
          <SocialListeningAdminAnalyticsView
            organizationId={organizationId}
            organizationName={organizationName}
            initialAnalytics={initialAnalytics}
          />
        )}
      </div>
    </main>
  )
}
