'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAdminSession } from '@/components/admin-session-provider'
import ThemeToggle from '@/components/theme-toggle'
import { bricolage_grot600 } from '@/styles/fonts'

export default function CollaborateShell({ children }: { children: React.ReactNode }) {
  const { session } = useAdminSession()
  const router = useRouter()
  const email = session?.mode === 'user' ? session.email : null

  return (
    <div className="flex min-h-svh flex-col bg-app-bg">
      <header className="admin-surface flex items-center justify-between gap-4 border-b border-chambray/8 px-4 py-3 sm:px-6">
        <Link href="/collaborate" className="block max-w-[10rem]">
          <Image
            src="/co_create_logo_hor_blue.svg"
            alt="CoCreate Caribbean"
            width={152}
            height={36}
            className="h-auto w-full dark:hidden"
          />
          <Image
            src="/co_create_logo_hor_wht.svg"
            alt="CoCreate Caribbean"
            width={152}
            height={36}
            className="hidden h-auto w-full dark:block"
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle variant="header" />
          {email ? (
            <span className="hidden text-sm text-app-muted md:inline">{email}</span>
          ) : null}
          <button
            type="button"
            onClick={() => router.push('/auth/signout')}
            className="admin-btn-ghost inline-flex items-center gap-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <p className={`text-sm text-app-muted ${bricolage_grot600.className}`}>
          Project workspace
        </p>
        {children}
      </main>
    </div>
  )
}
