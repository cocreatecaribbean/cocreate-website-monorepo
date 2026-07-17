import Link from 'next/link'
import { redirect } from 'next/navigation'
import CoCreateLogo from '@/components/cocreate-logo'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  fetchClientPortalProfile,
  resolveCanUseSocialListening,
} from '@/lib/client-session'
import ClientPortalShell from '@/components/client-portal-shell'
import ClientPortalDashboard from '@/components/client-portal-dashboard'
import { PortalProfileProvider } from '@/components/portal-profile-provider'
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
          <p className={`mt-4 text-base leading-relaxed text-app-muted ${bricolage_grot500.className}`}>
            Your project workspace — files, updates, top picks, and brand analytics in one
            place.
          </p>
          <p className="mt-4 text-sm text-app-muted">
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
  if (!profile?.user.email) {
    return (
      <ClientPortalShell userEmail={user.email} organizationName={null} organizationLogoUrl={null}>
        <main className="relative mx-auto w-full max-w-3xl px-6 py-16 sm:px-8">
          <div className="portal-glass-card p-8 sm:p-10">
            <p className="portal-eyebrow">Client Portal</p>
            <h1 className={`portal-display mt-2 ${alkatra600.className}`}>Service temporarily unavailable</h1>
            <p className={`mt-4 text-base leading-relaxed text-app-muted ${bricolage_grot500.className}`}>
              We could not reach the API to load your workspace right now. Please try again in a
              moment. If you are running locally, make sure the API is running at{' '}
              <span className="font-medium">http://localhost:3001</span>.
            </p>
          </div>
        </main>
      </ClientPortalShell>
    )
  }

  const displayEmail = profile.user.email
  const hasSocialListening = resolveCanUseSocialListening(profile)
  const isSocialAnalyst = Boolean(profile.permissions.isSocialAnalyst)

  return (
    <PortalProfileProvider profile={profile}>
      <ClientPortalShell
        userEmail={displayEmail}
        organizationName={profile.organization?.name ?? null}
        organizationLogoUrl={profile.organization?.logoUrl ?? null}
        hasSocialListening={hasSocialListening}
      >
        <ClientPortalDashboard
          userEmail={displayEmail}
          organizationName={profile.organization?.name ?? null}
          organizationLogoUrl={profile.organization?.logoUrl ?? null}
          hasSocialListening={hasSocialListening}
          isOwner={profile.user.clientOrgRole === 'ADMIN'}
          isSocialAnalyst={isSocialAnalyst}
        />
      </ClientPortalShell>
    </PortalProfileProvider>
  )
}
