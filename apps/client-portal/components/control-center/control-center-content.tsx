'use client'

import Link from 'next/link'
import ControlCenterProjectsView from '@/components/control-center/control-center-projects-view'
import ClientPortalRecentUpdates from '@/components/client-portal-recent-updates'
import OrgInboxMessagesView from '@/components/control-center/org-inbox-messages-view'
import PortalSettingsPanel from '@/components/portal-settings-panel'
import PortalTeamHub from '@/components/portal-team-hub'
import { ATTENTION_PAGE_PATH } from '@/lib/control-center/attention-items'
import type { ControlCenterViewId } from '@/lib/control-center/nav'
import { buildClientDashboardKpis } from '@/lib/dashboard/format-dashboard-stats'
import { useSharedClientRecentActivity } from '@/lib/dashboard/use-shared-client-recent-activity'
import { useDashboardStatsQuery } from '@/lib/api/queries/projects'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowRight,
  Star,
  FileText,
  FolderKanban,
} from 'lucide-react'

const KPI_META = [
  {
    label: 'Active projects',
    icon: FolderKanban,
    accent: 'bg-sanmarino/10 text-sanmarino',
  },
  {
    label: 'Top Picks',
    icon: Star,
    accent: 'bg-casablanca/15 text-chambray',
  },
  {
    label: 'Shared files',
    icon: FileText,
    accent: 'bg-chambray/10 text-chambray',
  },
] as const

type ControlCenterContentProps = {
  activeView: ControlCenterViewId
  projectsListKey: number
}

export default function ControlCenterContent({
  activeView,
  projectsListKey,
}: ControlCenterContentProps) {
  switch (activeView) {
    case 'overview':
      return <OverviewSection />
    case 'projects':
      return <ControlCenterProjectsView key={projectsListKey} />
    case 'activity':
      return <ActivitySection />
    case 'messages':
      return <OrgInboxMessagesView />
    case 'team':
      return <PortalTeamHub />
    case 'settings':
      return <SettingsSection />
    default:
      return <OverviewSection />
  }
}

function KpiGrid({
  delayOffset = 0,
  stats,
  loading,
  error,
}: {
  delayOffset?: number
  stats: ReturnType<typeof buildClientDashboardKpis> | null
  loading: boolean
  error?: boolean
}) {
  const delays = ['', 'portal-animate-in-delay-1', 'portal-animate-in-delay-2'] as const
  const rows =
    stats ??
    KPI_META.map((meta) => ({
      ...meta,
      value: '—',
      hint: error ? 'Could not load stats' : loading ? 'Loading…' : 'No data yet',
    }))

  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-busy={loading}>
      {rows.map((stat, i) => {
        const meta = KPI_META[i]!
        const Icon = meta.icon
        return (
          <article
            key={meta.label}
            className={`portal-glass-kpi portal-shine-hover portal-animate-in relative overflow-hidden p-5 ${delays[i + delayOffset] ?? ''}`}
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sanmarino/60 to-chambray/40"
              aria-hidden
            />
            <div className={`mt-1 inline-flex rounded-2xl p-2.5 ${meta.accent}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <p className={`mt-4 text-2xl text-chambray ${bricolage_grot700.className}`}>
              {stat.value}
            </p>
            <p className={`mt-1 text-sm text-app-primary ${bricolage_grot600.className}`}>
              {meta.label}
            </p>
            <p className="mt-0.5 text-xs text-app-muted">{stat.hint}</p>
          </article>
        )
      })}
    </section>
  )
}

function OverviewSection() {
  const { overviewItems: recentActivity, isLoading: activityLoading } =
    useSharedClientRecentActivity()
  const {
    data: statsData,
    isLoading: kpiLoading,
    isError: kpiError,
  } = useDashboardStatsQuery()
  const kpiStats = statsData
    ? buildClientDashboardKpis(statsData)
    : kpiLoading || kpiError
      ? null
      : buildClientDashboardKpis({
          activeProjects: 0,
          activeProjectsAwaitingReview: 0,
          topPicksCount: 0,
          sharedFiles: 0,
          lastSharedFileAt: null,
        })

  return (
    <div className="space-y-4 sm:space-y-6">
      <KpiGrid stats={kpiStats} loading={kpiLoading} error={kpiError} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="portal-glass-card portal-animate-in portal-animate-in-delay-3 p-5 sm:p-6">
          <p className="portal-eyebrow">Quick actions</p>
          <h3 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            What needs you today
          </h3>
          <p className="mt-4 text-sm text-app-muted">
            Open a project and visit its Top Picks tab for files your CoCreate team loved, or
            check{' '}
            <Link href={ATTENTION_PAGE_PATH} className="text-sanmarino hover:underline">
              items needing attention
            </Link>
            .
          </p>
          <Link
            href={ATTENTION_PAGE_PATH}
            className="portal-btn-primary mt-5 w-full gap-2 sm:w-auto"
          >
            View attention items
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
        <section className="portal-glass-card portal-animate-in portal-animate-in-delay-4 flex flex-col p-5 sm:p-6">
          <p className="portal-eyebrow">Latest activity</p>
          <h3 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            Recent updates
          </h3>
          <p className="mt-1 text-sm text-app-muted">
            What changed recently across your projects.
          </p>
          {activityLoading ? (
            <p className="mt-5 text-sm text-app-muted">Loading activity…</p>
          ) : (
            <ClientPortalRecentUpdates items={recentActivity} compact />
          )}
        </section>
      </div>
    </div>
  )
}

function ActivitySection() {
  const { allItems: items, isLoading: loading } = useSharedClientRecentActivity()

  return (
    <div className="space-y-6">
      <section className="portal-surface-solid portal-animate-in p-6 sm:p-8">
        <p className="portal-eyebrow">Activity</p>
        <h3 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
          All recent updates
        </h3>
        {loading ? (
          <p className="mt-5 text-sm text-app-muted">Loading activity…</p>
        ) : (
          <div className="mt-5">
            <ClientPortalRecentUpdates items={items} />
          </div>
        )}
      </section>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <PortalSettingsPanel />
    </div>
  )
}
