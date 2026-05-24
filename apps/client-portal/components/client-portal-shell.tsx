'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import PortalBrandHeader from '@/components/portal-brand-header'

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
      <header className="shrink-0 border-b border-chambray/10 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <PortalBrandHeader
            organizationName={organizationName}
            organizationLogoUrl={organizationLogoUrl}
            priority
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <p className="hidden max-w-48 truncate text-sm text-slate-600 md:block">
              {userEmail}
            </p>
            <Link
              href="/auth/signout"
              className="inline-flex items-center gap-2 rounded-full border border-chambray/15 px-4 py-2 text-sm font-medium text-chambray transition hover:border-sanmarino hover:bg-sanmarino/5"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="shrink-0 border-t border-chambray/8 bg-white/60 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm sm:px-6 lg:px-8">
          <p className="truncate text-slate-500 md:hidden">{userEmail}</p>
          <Link
            href="/auth/signout"
            className="font-medium text-sanmarino hover:text-chambray hover:underline"
          >
            Sign out of the client portal
          </Link>
        </div>
      </footer>
    </div>
  )
}
