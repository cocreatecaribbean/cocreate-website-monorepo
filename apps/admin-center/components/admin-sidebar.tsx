'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { bricolage_grot600 } from '@/styles/fonts'
import { useAdminSession } from '@/components/admin-session-provider'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/',
  },
  {
    label: 'Project Center',
    href: '/project-center',
    icon: FolderKanban,
    match: (pathname) => pathname.startsWith('/project-center'),
  },
  {
    label: 'Clients',
    href: '/client-access',
    icon: Users,
    match: (pathname) => pathname.startsWith('/client-access'),
  },
  {
    label: 'Team',
    href: '/team',
    icon: Shield,
    match: (pathname) => pathname.startsWith('/team'),
  },
]

function isActive(item: NavItem, pathname: string) {
  return item.match?.(pathname) ?? pathname === item.href
}

type AdminSidebarProps = {
  onNavigate?: () => void
  showClose?: boolean
  onClose?: () => void
}

export default function AdminSidebar({
  onNavigate,
  showClose = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading: sessionLoading } = useAdminSession()

  const logout = async () => {
    router.push('/auth/signout')
    router.refresh()
  }

  return (
    <div className={`flex h-full flex-col px-4 py-6 sm:px-6 sm:py-8 ${bricolage_grot600.className}`}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="block w-full max-w-[10.5rem] sm:max-w-[11rem]"
        >
          <Image
            src="/co_create_logo_hor_wht.svg"
            alt="CoCreate Caribbean"
            width={176}
            height={40}
            priority
            className="h-auto w-full"
          />
        </Link>
        {showClose ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item, pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                group flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-all duration-200
                ${
                  active
                    ? 'bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/15'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? 'text-casablanca' : 'text-white/70 group-hover:text-white'}`}
                strokeWidth={1.75}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {session?.email ? (
        <p className="mt-4 truncate px-3 text-xs text-white/60" title={session.email}>
          Signed in as {session.email}
        </p>
      ) : sessionLoading ? null : session?.mode === 'api_key' ? (
        <p className="mt-4 px-3 text-xs text-white/60">Dev API key access</p>
      ) : null}

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-4 flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-5 w-5 shrink-0 text-white/70" strokeWidth={1.75} />
        Logout
      </button>
    </div>
  )
}
