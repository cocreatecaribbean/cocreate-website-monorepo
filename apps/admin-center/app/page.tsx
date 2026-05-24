import {
  ArrowUpRight,
  Bell,
  FolderKanban,
  Mail,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin-page-header'

const stats = [
  {
    label: 'Active clients',
    value: '24',
    change: '+3 this month',
    icon: Users,
    accent: 'bg-sanmarino/10 text-sanmarino',
  },
  {
    label: 'Open projects',
    value: '12',
    change: '4 in review',
    icon: FolderKanban,
    accent: 'bg-casablanca/15 text-chambray',
  },
  {
    label: 'Portal invites',
    value: '18',
    change: '6 pending sign-in',
    icon: Mail,
    accent: 'bg-chambray/10 text-chambray',
  },
  {
    label: 'Team capacity',
    value: '86%',
    change: 'Healthy load',
    icon: TrendingUp,
    accent: 'bg-emerald-500/10 text-emerald-700',
  },
]

const recentActivity = [
  {
    title: 'Portal access granted',
    detail: 'alex@acme.com added to client portal',
    time: '2 hours ago',
  },
  {
    title: 'Project brief uploaded',
    detail: 'Island Fresh rebrand — phase 2 assets',
    time: 'Yesterday',
  },
  {
    title: 'Client check-in scheduled',
    detail: 'Caribbean Tourism Board — Friday 10:00 AM',
    time: '2 days ago',
  },
]

export default function AdminHomePage() {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
        <Image
          src="/co_create_logo_hor_blue.svg"
          alt=""
          width={520}
          height={120}
          aria-hidden
          className="h-auto w-[min(85vw,28rem)] sm:w-[min(70vw,32rem)]"
        />
      </div>

      <AdminPageHeader
        eyebrow="Welcome to the"
        title="CoCreate Control Center"
        action={
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-chambray/10 bg-white text-chambray transition hover:border-sanmarino/30 hover:text-sanmarino"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
          </button>
        }
      />

      <div
        id="admin-page-content"
        className="relative z-10 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10"
      >
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_30px_rgba(57,65,154,0.06)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 sm:text-sm">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-chambray sm:mt-2 sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{stat.change}</p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-2.5 ${stat.accent}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_30px_rgba(57,65,154,0.06)] sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-chambray sm:text-lg">Quick actions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Jump into the workflows your team uses most.
                </p>
              </div>
              <Sparkles className="h-5 w-5 shrink-0 text-casablanca" strokeWidth={1.75} />
            </div>

            <div className="mt-4 grid gap-3 sm:mt-6 md:grid-cols-2">
              <Link
                href="/client-access"
                className="group flex min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl border border-chambray/10 bg-linear-to-br from-white to-sanmarino/5 px-4 py-4 transition hover:border-sanmarino/25 hover:shadow-sm active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-chambray">Manage client access</p>
                  <p className="mt-1 text-sm text-slate-500">Invite or revoke portal emails</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-sanmarino transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/project-center"
                className="group flex min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl border border-chambray/10 bg-linear-to-br from-white to-casablanca/10 px-4 py-4 transition hover:border-casablanca/30 hover:shadow-sm active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-chambray">Open project center</p>
                  <p className="mt-1 text-sm text-slate-500">Review active engagements</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-chambray transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_30px_rgba(57,65,154,0.06)] sm:rounded-3xl sm:p-6">
            <h2 className="text-base font-semibold text-chambray sm:text-lg">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">Latest updates across the admin center.</p>

            <ul className="mt-4 space-y-4 sm:mt-6">
              {recentActivity.map((item) => (
                <li
                  key={item.title}
                  className="border-b border-chambray/8 pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm wrap-break-word text-slate-600">{item.detail}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-sanmarino">
                    {item.time}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}
