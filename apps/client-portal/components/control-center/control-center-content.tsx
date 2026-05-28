'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import ControlCenterApprovalsView from '@/components/control-center/control-center-approvals-view'
import ControlCenterFilesSection from '@/components/control-center/control-center-files-section'
import ControlCenterProjectsView from '@/components/control-center/control-center-projects-view'
import ClientPortalRecentUpdates from '@/components/client-portal-recent-updates'
import PortalSectionPlaceholder from '@/components/portal/section-placeholder'
import PortalSettingsPanel from '@/components/portal-settings-panel'
import PortalTeamHub from '@/components/portal-team-hub'
import { ATTENTION_PAGE_PATH } from '@/lib/control-center/attention-items'
import type { ControlCenterViewId } from '@/lib/control-center/nav'
import { buildClientDashboardKpis } from '@/lib/dashboard/format-dashboard-stats'
import { useClientRecentActivity } from '@/lib/dashboard/use-client-recent-activity'
import {
  fetchDashboardStats,
  PORTAL_NOTIFICATIONS_REFRESH_EVENT,
} from '@/lib/projects/fetch-projects-client'
import { alkatra600, bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  FolderKanban,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

const KPI_META = [
  {
    label: 'Active projects',
    icon: FolderKanban,
    accent: 'bg-sanmarino/10 text-sanmarino',
  },
  {
    label: 'Pending approvals',
    icon: CheckCircle2,
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
    case 'approvals':
      return <ControlCenterApprovalsView />
    case 'files':
      return <ControlCenterFilesSection />
    case 'activity':
      return <ActivitySection />
    case 'messages':
      return <MessagesSection />
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
}: {
  delayOffset?: number
  stats: ReturnType<typeof buildClientDashboardKpis> | null
  loading: boolean
}) {
  const delays = ['', 'portal-animate-in-delay-1', 'portal-animate-in-delay-2'] as const
  const rows = stats ?? KPI_META.map((meta) => ({ ...meta, value: '—', hint: 'Loading…' }))

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
  const { items: recentActivity, loading: activityLoading } = useClientRecentActivity(8)
  const [kpiStats, setKpiStats] = useState<ReturnType<typeof buildClientDashboardKpis> | null>(
    null,
  )
  const [kpiLoading, setKpiLoading] = useState(true)

  const loadKpis = useCallback(async () => {
    setKpiLoading(true)
    const data = await fetchDashboardStats()
    setKpiStats(data ? buildClientDashboardKpis(data) : buildClientDashboardKpis({
      activeProjects: 0,
      activeProjectsAwaitingReview: 0,
      pendingApprovals: 0,
      sharedFiles: 0,
      lastSharedFileAt: null,
    }))
    setKpiLoading(false)
  }, [])

  useEffect(() => {
    void loadKpis()
  }, [loadKpis])

  useEffect(() => {
    const onRefresh = () => void loadKpis()
    window.addEventListener(PORTAL_NOTIFICATIONS_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(PORTAL_NOTIFICATIONS_REFRESH_EVENT, onRefresh)
  }, [loadKpis])

  return (
    <div className="space-y-6">
      <KpiGrid stats={kpiStats} loading={kpiLoading} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="portal-glass-card portal-animate-in portal-animate-in-delay-3 p-6">
          <p className="portal-eyebrow">Quick actions</p>
          <h3 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            What needs you today
          </h3>
          <p className="mt-4 text-sm text-app-muted">
            Open Approvals for reviews from your CoCreate team, or check{' '}
            <Link href={ATTENTION_PAGE_PATH} className="text-sanmarino hover:underline">
              items needing attention
            </Link>
            .
          </p>
          <Link
            href={ATTENTION_PAGE_PATH}
            className="portal-btn-primary mt-5 w-full gap-2 sm:w-auto"
          >
            Review approvals
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
        <section className="portal-glass-card portal-animate-in portal-animate-in-delay-4 flex flex-col p-6">
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
  const { items, loading } = useClientRecentActivity(25)

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

function MessagesSection() {
  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-gradient-hero portal-animate-in relative overflow-hidden p-8 sm:p-10">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-casablanca/20 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-xl">
          <p className="portal-eyebrow">Your team</p>
          <h3 className={`mt-2 text-2xl text-chambray ${alkatra600.className}`}>
            Message CoCreate
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-app-muted">
            Questions about a deliverable, timeline, or approval? Your account team responds within
            one business day.
          </p>
          <button type="button" className="portal-btn-primary mt-6 gap-2">
            <MessageSquare className="h-4 w-4" aria-hidden />
            Start a conversation
          </button>
        </div>
      </section>
      <section className="portal-surface-solid portal-animate-in portal-animate-in-delay-1 p-6">
        <p className={`text-sm text-app-muted ${bricolage_grot600.className}`}>
          Common topics
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Project timeline', 'File feedback', 'Billing question', 'New request'].map(
            (topic) => (
              <button
                key={topic}
                type="button"
                className="portal-btn-ghost rounded-full px-4 py-2"
              >
                {topic}
              </button>
            ),
          )}
        </div>
      </section>
      <PreviewBanner />
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <PortalSettingsPanel />
      <PreviewBanner />
    </div>
  )
}

function PreviewBanner() {
  return (
    <p className="flex items-center justify-center gap-2 text-center text-xs tracking-wide text-app-muted uppercase">
      <Sparkles className="h-3.5 w-3.5 text-sanmarino" aria-hidden />
      Preview workspace · Live data coming soon
    </p>
  )
}
