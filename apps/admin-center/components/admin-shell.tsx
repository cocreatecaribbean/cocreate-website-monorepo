'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import AdminSidebar from '@/components/admin-sidebar'
import {
  AdminAccessBanner,
  AdminSessionProvider,
} from '@/components/admin-session-provider'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/auth')

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <AdminSessionProvider>
      <AdminShellChrome>{children}</AdminShellChrome>
    </AdminSessionProvider>
  )
}

function AdminShellChrome({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-svh">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-chambray/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[min(88vw,18rem)] flex-col
          bg-linear-to-b from-chambray via-[#353d8f] to-[#2a3170] shadow-2xl
          transition-transform duration-300 ease-out
          lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none xl:w-72
          ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Suspense
          fallback={
            <div className="flex h-full flex-col px-4 py-6 sm:px-6 sm:py-8" aria-hidden>
              <div className="mb-8 h-10 w-40 rounded-lg bg-white/10" />
              <div className="flex flex-1 flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-white/10" />
                ))}
              </div>
            </div>
          }
        >
          <AdminSidebar
            onNavigate={() => setMenuOpen(false)}
            showClose
            onClose={() => setMenuOpen(false)}
          />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-surface sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="admin-btn-ghost flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <Link href="/" className="block max-w-[9.5rem] sm:max-w-[10.5rem]">
            <Image
              src="/co_create_logo_hor_blue.svg"
              alt="CoCreate Caribbean"
              width={152}
              height={36}
              priority
              className="h-auto w-full"
            />
          </Link>
          <div className="h-11 w-11 shrink-0" aria-hidden />
        </header>

        <AdminAccessBanner />
        {children}
      </div>
    </div>
  )
}
