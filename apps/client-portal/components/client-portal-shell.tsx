'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import PortalBrandHeader from '@/components/portal-brand-header'
import { bricolage_grot500 } from '@/styles/fonts'

type ClientPortalShellProps = {
  userEmail: string
  organizationName?: string | null
  organizationLogoUrl?: string | null
  children: React.ReactNode
}

export default function ClientPortalShell({
  userEmail,
  organizationName,
  organizationLogoUrl,
  children,
}: ClientPortalShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
        <header
          className={`portal-surface mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 ${bricolage_grot500.className}`}
        >
          <PortalBrandHeader
            organizationName={organizationName}
            organizationLogoUrl={organizationLogoUrl}
            priority
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden max-w-44 truncate text-sm text-slate-600 lg:block">
              {userEmail}
            </p>
            <Link href="/auth/signout" className="portal-btn-ghost">
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          </div>
        </header>
      </div>

      <div className="flex-1">{children}</div>

      <footer className="px-4 py-6 sm:px-6 lg:px-8">
        <div
          className={`mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm text-slate-500 ${bricolage_grot500.className}`}
        >
          <p className="truncate lg:hidden">{userEmail}</p>
          <p className="hidden text-xs uppercase tracking-[0.14em] text-slate-400 lg:block">
            CoCreate Caribbean · Client Portal
          </p>
          <Link
            href="/auth/signout"
            className="text-sanmarino transition hover:text-chambray"
          >
            Sign out
          </Link>
        </div>
      </footer>
    </div>
  )
}
