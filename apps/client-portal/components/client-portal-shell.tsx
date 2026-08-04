'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import PortalDrawerShell from '@cocreate/app-ui/portal-drawer-shell'
import ClientPortalNavDrawer from '@/components/client-portal-nav-drawer'
import PortalBrandHeader from '@/components/portal-brand-header'
import PortalUserAvatar from '@/components/portal-user-avatar'
import OrganizationSwitcher from '@/components/organization-switcher'
import ClientPortalAssistant from '@/components/assistant/client-portal-assistant'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { setActiveOrganizationId } from '@/lib/api/active-organization'
import { resolveCanUseSocialListening } from '@/lib/portal-profile-types'
import {
  getMarketingCookiesUrl,
  getMarketingPrivacyUrl,
  getMarketingSiteOrigin,
  warnIfMarketingSiteUrlMissing,
} from '@/lib/marketing-site-url'
import { bricolage_grot400, bricolage_grot500 } from '@/styles/fonts'

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
      <PortalFooter />
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

      <PortalFooter />
      <ClientPortalAssistant />
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

/** Compact chambray brand footer (stripped marketing footer). */
function PortalFooter() {
  const [year, setYear] = useState<number | null>(null)
  const marketingOrigin = getMarketingSiteOrigin()
  const privacyUrl = getMarketingPrivacyUrl()
  const cookiesUrl = getMarketingCookiesUrl()

  useEffect(() => {
    setYear(new Date().getFullYear())
    warnIfMarketingSiteUrlMissing()
  }, [])

  const linkClass =
    'text-sm text-white/90 transition hover:text-casablanca underline-offset-2 hover:underline'

  return (
    <footer
      className={`mt-auto bg-chambray text-white ${bricolage_grot400.className}`}
    >
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          {marketingOrigin ? (
            <a
              href={marketingOrigin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Image
                src="/co_create_logo_hor_wht.svg"
                alt="CoCreate Caribbean"
                width={160}
                height={36}
                className="h-8 w-auto sm:h-9"
              />
            </a>
          ) : (
            <Image
              src="/co_create_logo_hor_wht.svg"
              alt="CoCreate Caribbean"
              width={160}
              height={36}
              className="h-8 w-auto sm:h-9"
            />
          )}
          <p className="text-xs text-white/70">
            &copy; {year != null ? `${year} ` : ''}CoCreate Caribbean Limited.
          </p>
        </div>

        <div
          className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-3 ${bricolage_grot500.className}`}
        >
          {privacyUrl ? (
            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Privacy
            </a>
          ) : null}
          {cookiesUrl ? (
            <a
              href={cookiesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Cookies
            </a>
          ) : null}
          <SignOutButton className={linkClass}>Sign out</SignOutButton>
        </div>
      </div>
    </footer>
  )
}
