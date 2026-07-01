import {
  ArrowUpRight,
  Bell,
  FolderKanban,
  Mail,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin-page-header'
import AdminRecentUpdates from '@/components/admin-recent-updates'
import { AdminHomeHydrator } from '@/components/admin-home-hydrator'
import { fetchAdminRecentActivity } from '@/lib/dashboard/fetch-dashboard-activity'
import {
  buildAdminDashboardKpis,
  fetchAdminDashboardStats,
} from '@/lib/dashboard/fetch-dashboard-stats'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

const KPI_META = [
  {
    icon: Users,
    accentBar: 'from-sanmarino to-chambray',
    accent: 'bg-sanmarino/10 text-sanmarino',
  },
  {
    icon: FolderKanban,
    accentBar: 'from-casablanca to-sanmarino',
    accent: 'bg-casablanca/15 text-chambray',
  },
  {
    icon: Mail,
    accentBar: 'from-chambray to-sanmarino',
    accent: 'bg-chambray/10 text-chambray',
  },
  {
    icon: Radio,
    accentBar: 'from-emerald-400 to-sanmarino',
    accent: 'bg-emerald-500/10 text-emerald-700',
  },
] as const

const KPI_STAGGER = [
  '',
  'admin-animate-in-delay-1',
  'admin-animate-in-delay-2',
  'admin-animate-in-delay-3',
] as const

export default async function AdminHomePage() {
  const [dashboardStats, recentActivity] = await Promise.all([
    fetchAdminDashboardStats(),
    fetchAdminRecentActivity(15),
  ])
  const stats = buildAdminDashboardKpis(dashboardStats)

  return (
    <AdminHomeHydrator stats={dashboardStats} activity={recentActivity}>
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <Image
          src="/co_create_logo_hor_blue.svg"
          alt=""
          width={520}
          height={120}
          aria-hidden
          className="h-auto w-[min(85vw,28rem)] sm:w-[min(70vw,32rem)] dark:hidden"
        />
        <Image
          src="/co_create_logo_hor_wht.svg"
          alt=""
          width={520}
          height={120}
          aria-hidden
          className="hidden h-auto w-[min(85vw,28rem)] sm:w-[min(70vw,32rem)] dark:block"
        />
      </div>

      <AdminPageHeader
        eyebrow="Welcome to the"
        title="CoCreate Control Center"
        action={
          <button
            type="button"
            aria-label="Notifications"
            className="admin-btn-ghost flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
          </button>
        }
      />

      <div
        id="admin-page-content"
        className="relative z-10 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10"
      >
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => {
            const meta = KPI_META[i]!
            const Icon = meta.icon
            return (
              <article
                key={stat.label}
                className={`admin-glass-kpi admin-animate-in relative flex min-h-[7rem] flex-col justify-between p-5 ${KPI_STAGGER[i] ?? ''}`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${meta.accentBar}`}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-app-muted">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-2 text-2xl tabular-nums text-chambray sm:text-[1.75rem] ${bricolage_grot700.className}`}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-2.5 ${meta.accent}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-app-muted">{stat.change}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="admin-glass-card admin-shine-hover admin-animate-in admin-animate-in-delay-1 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="admin-eyebrow">Workflows</p>
                <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
                  Quick actions
                </h2>
                <p className="mt-1 text-sm text-app-muted">
                  Jump into the workflows your team uses most.
                </p>
              </div>
              <Sparkles className="h-5 w-5 shrink-0 text-casablanca" strokeWidth={1.75} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
              <Link
                href="/team"
                className="group admin-action-tile bg-linear-to-br from-white/80 to-chambray/5 dark:bg-linear-to-br dark:from-chambray/45 dark:via-chambray/15 dark:to-sanmarino/10 dark:ring-1 dark:ring-inset dark:ring-white/10"
              >
                <div className="min-w-0">
                  <p className={`font-medium text-chambray ${bricolage_grot600.className}`}>
                    Manage agency team
                  </p>
                  <p className="mt-1 text-sm text-app-muted">Invite admins who can sign in</p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-chambray transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-sanmarino"
                  strokeWidth={1.75}
                />
              </Link>
              <Link
                href="/client-access"
                className="group admin-action-tile bg-linear-to-br from-white/80 to-sanmarino/10 dark:bg-linear-to-br dark:from-sanmarino/40 dark:via-chambray/20 dark:to-chambray/10 dark:ring-1 dark:ring-inset dark:ring-sanmarino/25"
              >
                <div className="min-w-0">
                  <p className={`font-medium text-chambray ${bricolage_grot600.className}`}>
                    Manage client access
                  </p>
                  <p className="mt-1 text-sm text-app-muted">Invite or revoke portal emails</p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-sanmarino transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.75}
                />
              </Link>
              <Link
                href="/project-center"
                className="group admin-action-tile bg-linear-to-br from-white/80 to-casablanca/15 dark:bg-linear-to-br dark:from-casablanca/18 dark:via-sanmarino/15 dark:to-chambray/25 dark:ring-1 dark:ring-inset dark:ring-casablanca/20"
              >
                <div className="min-w-0">
                  <p className={`font-medium text-chambray ${bricolage_grot600.className}`}>
                    Open project center
                  </p>
                  <p className="mt-1 text-sm text-app-muted">Review active engagements</p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-chambray transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-sanmarino"
                  strokeWidth={1.75}
                />
              </Link>
            </div>
          </article>

          <article className="admin-glass-card admin-animate-in admin-animate-in-delay-2 flex flex-col p-5 sm:p-6">
            <p className="admin-eyebrow">Activity</p>
            <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
              Recent updates
            </h2>
            <p className="mt-1 text-sm text-app-muted">Latest updates across the admin center.</p>

            <AdminRecentUpdates items={recentActivity} />
          </article>
        </section>
      </div>
    </main>
    </AdminHomeHydrator>
  )
}
