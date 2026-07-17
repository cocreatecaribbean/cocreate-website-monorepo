'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import PortalDrawerShell from '@cocreate/app-ui/portal-drawer-shell'
import ClientPortalNavDrawer from '@/components/client-portal-nav-drawer'
import PortalBrandHeader from '@/components/portal-brand-header'
import PortalUserAvatar from '@/components/portal-user-avatar'
import OrganizationSwitcher from '@/components/organization-switcher'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { setActiveOrganizationId } from '@/lib/api/active-organization'
import { resolveCanUseSocialListening } from '@/lib/portal-profile-types'
import { bricolage_grot500 } from '@/styles/fonts'

type ClientPortalShellProps = {
  userEmail: string
  organizationName?: string | null
  organizationLogoUrl?: string | null
  hasSocialListening?: boolean
  children: React.ReactNode
}

/** Never use <Link href="/auth/signout"> — Next.js Link prefetch GETs the route and signs users out. */
function SignOutButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        router.push('/auth/signout')
      }}
    >
      {children}
    </button>
  )
}

export default function ClientPortalShell(props: ClientPortalShellProps) {
  return (
    <Suspense fallback={<ClientPortalShellFallback {...props} />}>
      <ClientPortalShellInner {...props} />
    </Suspense>
  )
}

function ClientPortalShellFallback({
  userEmail,
  organizationName,
  organizationLogoUrl,
  children,
}: ClientPortalShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <DesktopHeader
        userEmail={userEmail}
        organizationName={organizationName}
        organizationLogoUrl={organizationLogoUrl}
      />
      <div className="flex-1">{children}</div>
      <PortalFooter userEmail={userEmail} />
    </div>
  )
}

function ClientPortalShellInner({
  userEmail,
  organizationName,
  organizationLogoUrl,
  hasSocialListening,
  children,
}: ClientPortalShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: profile } = usePortalProfileQuery()
  const resolvedOrgName = profile?.organization?.name ?? organizationName
  const resolvedOrgLogo = profile?.organization?.logoUrl ?? organizationLogoUrl
  const resolvedSocialListening =
    hasSocialListening ??
    (profile ? resolveCanUseSocialListening(profile) : false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname, searchParams])

  useEffect(() => {
    if (profile?.organization?.id) {
      setActiveOrganizationId(profile.organization.id)
    }
  }, [profile?.organization?.id])

  return (
    <PortalDrawerShell
      open={menuOpen}
      onOpenChange={setMenuOpen}
      variant="overlay"
      className="flex min-h-svh flex-col"
      sidebar={
        <ClientPortalNavDrawer
          organizationName={resolvedOrgName}
          hasSocialListening={resolvedSocialListening}
          onClose={() => setMenuOpen(false)}
        />
      }
    >
      <div className="sticky top-0 z-30 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pt-4">
        <header
          className={`portal-surface mx-auto flex w-full max-w-[88rem] items-center justify-between gap-3 px-4 py-3 sm:px-6 ${bricolage_grot500.className}`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
              className="portal-btn-ghost flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0 lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <PortalBrandHeader
              organizationName={resolvedOrgName}
              organizationLogoUrl={resolvedOrgLogo}
              priority
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <OrganizationSwitcher />
            <p className="hidden max-w-44 truncate text-sm text-app-muted dark:text-white/90 lg:block">
              {userEmail}
            </p>
            <PortalUserAvatar size="sm" />
            <SignOutButton className="portal-btn-ghost">
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </SignOutButton>
          </div>
        </header>
      </div>

      <div className="flex-1">{children}</div>

      <PortalFooter userEmail={userEmail} />
    </PortalDrawerShell>
  )
}

function DesktopHeader({
  userEmail,
  organizationName,
  organizationLogoUrl,
}: Omit<ClientPortalShellProps, 'children'>) {
  return (
    <div className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <header
        className={`portal-surface mx-auto flex w-full max-w-[88rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 ${bricolage_grot500.className}`}
      >
        <PortalBrandHeader
          organizationName={organizationName}
          organizationLogoUrl={organizationLogoUrl}
          priority
        />
        <div className="flex items-center gap-2 sm:gap-3">
          <p className="hidden max-w-44 truncate text-sm text-app-muted dark:text-white/90 lg:block">
            {userEmail}
          </p>
          <PortalUserAvatar size="sm" />
          <SignOutButton className="portal-btn-ghost">
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </SignOutButton>
        </div>
      </header>
    </div>
  )
}

function PortalFooter({ userEmail }: { userEmail: string }) {
  return (
    <footer className="px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex w-full max-w-[88rem] flex-wrap items-center justify-between gap-3 text-sm text-app-muted dark:text-white/80 ${bricolage_grot500.className}`}
      >
        <p className="truncate lg:hidden dark:text-white/90">{userEmail}</p>
        <p className="hidden text-xs uppercase tracking-[0.14em] text-app-muted dark:text-casablanca/90 lg:block">
          CoCreate Caribbean · Client Portal
        </p>
        <SignOutButton className="text-sanmarino transition hover:text-chambray dark:text-casablanca dark:hover:text-white">
          Sign out
        </SignOutButton>
      </div>
    </footer>
  )
}
