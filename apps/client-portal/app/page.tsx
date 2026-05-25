import Link from 'next/link'
import CoCreateLogo from '@/components/cocreate-logo'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchClientPortalProfile } from '@/lib/client-session'
import { fetchSocialListeningAnalytics } from '@/lib/social-listening/fetch-analytics'
import ClientPortalShell from '@/components/client-portal-shell'
import ClientPortalDashboard from '@/components/client-portal-dashboard'
import { alkatra600, bricolage_grot500 } from '@/styles/fonts'

export default async function ClientPortalHomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
        <div className="portal-surface-solid p-8 sm:p-10">
          <CoCreateLogo className="h-10 w-auto" priority />
          <p className="portal-eyebrow mt-8">CoCreate Caribbean</p>
          <h1 className={`portal-display mt-2 ${alkatra600.className}`}>Client Portal</h1>
          <p className={`mt-4 text-base leading-relaxed text-slate-600 ${bricolage_grot500.className}`}>
            Your project workspace — files, updates, approvals, and brand analytics in one
            place.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Sign in from the CoCreate website or use the link from your invitation email.
          </p>
          <Link href="/login" className="portal-btn-primary mt-8">
            Go to sign in
          </Link>
        </div>
      </main>
    )
  }

  const profile = await fetchClientPortalProfile()
  const hasSocialListening = Boolean(
    profile?.organization?.isSocialListeningSubscriber,
  )
  const socialListeningAnalytics = hasSocialListening
    ? await fetchSocialListeningAnalytics()
    : null

  return (
    <ClientPortalShell
      userEmail={user.email}
      organizationName={profile?.organization?.name ?? null}
      organizationLogoUrl={profile?.organization?.logoUrl ?? null}
    >
      <ClientPortalDashboard
        userEmail={user.email}
        organizationName={profile?.organization?.name ?? null}
        organizationLogoUrl={profile?.organization?.logoUrl ?? null}
        hasSocialListening={hasSocialListening}
        socialListeningAnalytics={socialListeningAnalytics}
      />
    </ClientPortalShell>
  )
}
