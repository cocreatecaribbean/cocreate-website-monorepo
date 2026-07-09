'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LogOut,
  X,
} from 'lucide-react'
import NavTooltip from '@cocreate/app-ui/nav-tooltip'
import { bricolage_grot600 } from '@/styles/fonts'
import { useAdminSession } from '@/components/admin-session-provider'
import { isSuperAdminSession } from '@/lib/admin-session'
import {
  getActiveAdminNavId,
  normalizeAdminPathname,
} from '@/lib/admin-nav'
import { ADMIN_NAV_ITEMS, ADMIN_SUPER_NAV_ITEMS } from '@/lib/admin-nav-items'
import { useAdminOrgInboxUnreadCountQuery } from '@/lib/api/queries/org-inbox'
import { useAdminProfileQuery } from '@/lib/api/queries/profile'
import ThemeToggle from '@/components/theme-toggle'

function resolvePathname(routerPathname: string | null): string {
  if (routerPathname) return normalizeAdminPathname(routerPathname)
  if (typeof window !== 'undefined') {
    return normalizeAdminPathname(window.location.pathname)
  }
  return '/'
}

function useResolvedPathname(): string {
  const routerPathname = usePathname()
  const [pathname, setPathname] = useState(() => resolvePathname(routerPathname))

  useEffect(() => {
    setPathname(resolvePathname(routerPathname))
  }, [routerPathname])

  return pathname
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
  const pathname = useResolvedPathname()
  const activeNavId = getActiveAdminNavId(pathname)
  const router = useRouter()
  const { session, loading: sessionLoading, clearQueryCache } = useAdminSession()
  const { data: orgInboxUnread = 0 } = useAdminOrgInboxUnreadCountQuery()
  const { data: profileData } = useAdminProfileQuery()
  const avatarUrl = profileData?.profile?.avatarUrl
  const items =
    session?.mode === 'api_key' || isSuperAdminSession(session?.role ?? null)
      ? [...ADMIN_NAV_ITEMS, ...ADMIN_SUPER_NAV_ITEMS]
      : ADMIN_NAV_ITEMS

  const logout = async () => {
    clearQueryCache()
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
        {items.map((item) => {
          const active = activeNavId === item.id
          const Icon = item.icon

          return (
            <NavTooltip key={item.id} description={item.description} className="w-full">
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`
                group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-all duration-200
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
                {item.id === 'messages' && orgInboxUnread > 0 ? (
                  <span className="ml-auto rounded-full bg-casablanca/90 px-2 py-0.5 text-xs text-chambray tabular-nums">
                    {orgInboxUnread}
                  </span>
                ) : null}
              </Link>
            </NavTooltip>
          )
        })}
      </nav>

      {session?.email ? (
        <div className="mt-4 space-y-3 px-3">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-white/10"
          >
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/80">
                  {(session.displayName ?? session.email)
                    .split(/[\s@]+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? '')
                    .join('') || '?'}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-white/90">
                {session.displayName ?? session.email}
              </span>
              <span className="block truncate text-xs text-white/55">{session.email}</span>
            </span>
          </Link>
          {!session.profileComplete && session.mode === 'user' ? (
            <Link
              href="/profile"
              onClick={onNavigate}
              className="text-xs text-casablanca underline underline-offset-2"
            >
              Complete your profile
            </Link>
          ) : null}
        </div>
      ) : sessionLoading ? null : session?.mode === 'api_key' ? (
        <p className="mt-4 px-3 text-xs text-white/60">Dev API key access</p>
      ) : null}

      <div className="mt-6 border-t border-white/10 pt-4">
        <ThemeToggle variant="sidebar" />
      </div>

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
