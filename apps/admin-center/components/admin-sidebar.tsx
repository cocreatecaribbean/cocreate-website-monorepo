'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

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

  const logout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col px-4 py-6 text-white sm:px-6 sm:py-8">
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
                group flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium
                transition-colors duration-200
                ${
                  active
                    ? 'bg-white/15 text-white shadow-sm'
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

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-6 flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-5 w-5 shrink-0 text-white/70" strokeWidth={1.75} />
        Logout
      </button>
    </div>
  )
}
