'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import ControlCenterApprovalsView from '@/components/control-center/control-center-approvals-view'
import ControlCenterProjectsView from '@/components/control-center/control-center-projects-view'
import PortalSectionPlaceholder from '@/components/portal/section-placeholder'
import PortalSettingsPanel from '@/components/portal-settings-panel'
import PortalTeamHub from '@/components/portal-team-hub'
import { ATTENTION_PAGE_PATH } from '@/lib/control-center/attention-items'
import type { ControlCenterViewId } from '@/lib/control-center/nav'
import { buildClientDashboardKpis } from '@/lib/dashboard/format-dashboard-stats'
import {
  fetchDashboardStats,
  PORTAL_NOTIFICATIONS_REFRESH_EVENT,
} from '@/lib/projects/fetch-projects-client'
import { alkatra600, bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowRight,
  CheckCircle2,
  Download,
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

const FILES = [
  { name: 'Brand-Guidelines-v2.pdf', project: 'Island Fresh', size: '4.2 MB', updated: '2h ago' },
  { name: 'Q2-Storyboard-FINAL.fig', project: 'Tourism board', size: '18 MB', updated: 'Yesterday' },
  { name: 'Kickoff-Timeline.xlsx', project: 'Portal onboarding', size: '890 KB', updated: '3d ago' },
  { name: 'Hero-Photography-Select.zip', project: 'Island Fresh', size: '124 MB', updated: '1w ago' },
] as const

const ACTIVITY = [
  {
    title: 'Brand guidelines v2 ready for review',
    project: 'cancara',
    time: '2 hours ago',
  },
  {
    title: 'Portmore park uploaded',
    project: 'udc',
    time: 'Yesterday',
  },
  {
    title: 'Kickoff notes and timeline shared',
    project: 'Portal onboarding',
    time: '3 days ago',
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
      return <FilesSection />
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
        <section className="portal-glass-card portal-animate-in portal-animate-in-delay-4 p-6">
          <p className="portal-eyebrow">Latest activity</p>
          <h3 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            Recent updates
          </h3>
          <ul className="mt-5 space-y-4">
            {ACTIVITY.map((item) => (
              <li key={item.title} className="border-b border-chambray/6 pb-4 last:border-0 last:pb-0">
                <p className={`text-sm text-app-primary ${bricolage_grot600.className}`}>{item.title}</p>
                <p className="text-xs text-sanmarino">{item.project}</p>
                <p className="mt-1 text-xs text-app-muted">{item.time}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function FilesSection() {
  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-animate-in overflow-hidden">
        <div className="hidden border-b border-chambray/8 bg-chambray/[0.03] px-5 py-3 text-xs font-medium tracking-wide text-app-muted uppercase dark:border-white/10 dark:bg-white/5 sm:grid sm:grid-cols-[1fr_140px_100px_80px] sm:gap-4">
          <span>File</span>
          <span>Project</span>
          <span>Updated</span>
          <span className="text-right">Size</span>
        </div>
        <ul>
          {FILES.map((file, i) => (
            <li
              key={file.name}
              className={`flex flex-col gap-3 border-b border-chambray/6 px-5 py-4 last:border-0 sm:grid sm:grid-cols-[1fr_140px_100px_80px] sm:items-center sm:gap-4 ${
                i % 2 === 1 ? 'bg-chambray/[0.02]' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sanmarino/10 text-sanmarino">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <p className={`truncate text-sm text-chambray ${bricolage_grot600.className}`}>
                  {file.name}
                </p>
              </div>
              <p className="text-sm text-sanmarino sm:truncate">{file.project}</p>
              <p className="text-xs text-app-muted">{file.updated}</p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="text-xs text-app-muted">{file.size}</span>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sanmarino transition hover:bg-chambray/8 hover:text-chambray"
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <PreviewBanner />
    </div>
  )
}

function ActivitySection() {
  return (
    <div className="space-y-6">
      <section className="portal-surface-solid portal-animate-in p-6 sm:p-8">
        <ul className="divide-y divide-chambray/6">
          {ACTIVITY.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-1 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className={`text-app-primary ${bricolage_grot600.className}`}>{item.title}</p>
                <p className="text-sm text-sanmarino">{item.project}</p>
              </div>
              <p className="text-xs text-app-muted sm:text-sm">{item.time}</p>
            </li>
          ))}
        </ul>
      </section>
      <PreviewBanner />
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
