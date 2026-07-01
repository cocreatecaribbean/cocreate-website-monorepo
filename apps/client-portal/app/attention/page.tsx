import { redirect } from 'next/navigation'
import AttentionItemsPage from '@/components/control-center/attention-items-page'
import ClientPortalShell from '@/components/client-portal-shell'
import { fetchClientPortalProfile, resolveCanUseSocialListening } from '@/lib/client-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AttentionPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/login')
  }

  const profile = await fetchClientPortalProfile()
  if (!profile?.user.email) {
    return (
      <ClientPortalShell
        userEmail={user.email}
        organizationName={null}
        organizationLogoUrl={null}
      >
        <main className="relative mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="portal-glass-card p-6">
            <p className="portal-eyebrow">Client Portal</p>
            <p className="mt-3 text-sm text-slate-600">
              We could not reach the API to load your workspace right now. Please try again in a
              moment. If you are running locally, make sure the API is running at{' '}
              <span className="font-medium">http://localhost:3001</span>.
            </p>
          </div>
        </main>
      </ClientPortalShell>
    )
  }

  const hasSocialListening = resolveCanUseSocialListening(profile)

  return (
    <ClientPortalShell
      userEmail={profile.user.email}
      organizationName={profile.organization?.name ?? null}
      organizationLogoUrl={profile.organization?.logoUrl ?? null}
      hasSocialListening={hasSocialListening}
    >
      <main className="relative mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <AttentionItemsPage organizationName={profile.organization?.name ?? null} />
      </main>
    </ClientPortalShell>
  )
}
