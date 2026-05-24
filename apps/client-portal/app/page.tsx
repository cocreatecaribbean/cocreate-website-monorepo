import Link from 'next/link'
import CoCreateLogo from '@/components/cocreate-logo'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchClientPortalProfile } from '@/lib/client-session'
import ClientPortalShell from '@/components/client-portal-shell'
import ClientPortalDashboard from '@/components/client-portal-dashboard'

export default async function ClientPortalHomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <CoCreateLogo className="h-10 w-auto" priority />
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-sanmarino">
          CoCreate Caribbean
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-chambray">Client Portal</h1>
        <p className="mt-4 text-base text-slate-600">
          Your project workspace will live here — files, updates, and approvals.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Sign in from the CoCreate website or use the link from your invitation email.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex w-fit rounded-full bg-chambray px-6 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino"
        >
          Go to sign in
        </Link>
      </main>
    )
  }

  const profile = await fetchClientPortalProfile()
  const hasSocialListening = Boolean(
    profile?.organization?.isSocialListeningSubscriber,
  )

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
      />
    </ClientPortalShell>
  )
}
