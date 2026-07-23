'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ScrollFadeHint } from '@cocreate/app-ui/scroll-fade-hint'
import ControlCenterProjectsView from '@/components/control-center/control-center-projects-view'
import ClientPortalRecentUpdates from '@/components/client-portal-recent-updates'
import OrgInboxMessagesView from '@/components/control-center/org-inbox-messages-view'
import PortalSettingsPanel from '@/components/portal-settings-panel'
import PortalTeamHub from '@/components/portal-team-hub'
import { ATTENTION_PAGE_PATH } from '@/lib/control-center/attention-items'
import type { ControlCenterViewId } from '@/lib/control-center/nav'
import {
  PROJECT_ID_QUERY,
  PROJECT_TAB_QUERY,
  type PortalProjectTabId,
} from '@/lib/control-center/project-workspace'
import { buildClientDashboardKpis } from '@/lib/dashboard/format-dashboard-stats'
import { useSharedClientRecentActivity } from '@/lib/dashboard/use-shared-client-recent-activity'
import { useDashboardStatsQuery } from '@/lib/api/queries/projects'
import type { ClientDashboardProjectCount } from '@cocreate/api-contracts/v1/client-portal'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowRight,
  Star,
  FileText,
  FolderKanban,
} from 'lucide-react'

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

function projectTabHref(projectId: string, tab: PortalProjectTabId) {
  const params = new URLSearchParams()
  params.set('ccView', 'projects')
  params.set(PROJECT_ID_QUERY, projectId)
  params.set(PROJECT_TAB_QUERY, tab)
  return `/?${params.toString()}`
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

function ProjectCountListCard({
  label,
  icon: Icon,
  accent,
  projects,
  tab,
  countLabel,
  emptyMessage,
  loading,
  error,
  delayClass,
}: {
  label: string
  icon: LucideIcon
  accent: string
  projects: ClientDashboardProjectCount[]
  tab: PortalProjectTabId
  countLabel: (count: number) => string
  emptyMessage: string
  loading: boolean
  error?: boolean
  delayClass: string
}) {
  return (
    <div
      className={`portal-glass-kpi portal-animate-in relative flex min-h-0 flex-col overflow-hidden p-5 ${delayClass}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sanmarino/60 to-chambray/40"
        aria-hidden
      />
      <div className={`mt-1 inline-flex w-fit rounded-2xl p-2.5 ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className={`mt-4 text-sm text-app-primary ${bricolage_grot600.className}`}>{label}</p>
      <ScrollFadeHint className="mt-3" scrollClassName="max-h-44 pr-1">
        {loading ? (
          <p className="text-xs text-app-muted">Loading…</p>
        ) : error ? (
          <p className="text-xs text-app-muted">Could not load stats</p>
        ) : projects.length === 0 ? (
          <p className="text-xs text-app-muted">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={projectTabHref(project.id, tab)}
                  className="block rounded-xl px-2 py-2 transition-colors hover:bg-sanmarino/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sanmarino"
                >
                  <p className={`text-sm text-app-primary ${bricolage_grot600.className}`}>
                    {project.title}
                  </p>
                  <p className="mt-0.5 text-xs text-app-muted">{countLabel(project.count)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ScrollFadeHint>
    </div>
  )
}

function DashboardKpiGrid({
  activeValue,
  activeHint,
  topPicksProjects,
  sharedFilesProjects,
  loading,
  error,
}: {
  activeValue: string
  activeHint: string
  topPicksProjects: ClientDashboardProjectCount[]
  sharedFilesProjects: ClientDashboardProjectCount[]
  loading: boolean
  error?: boolean
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-busy={loading}>
      <Link
        href="/?ccView=projects"
        className="portal-glass-kpi portal-shine-hover portal-animate-in relative block overflow-hidden p-5"
      >
        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sanmarino/60 to-chambray/40"
          aria-hidden
        />
        <div className="mt-1 inline-flex rounded-2xl bg-sanmarino/10 p-2.5 text-sanmarino">
          <FolderKanban className="h-5 w-5" aria-hidden />
        </div>
        <p className={`mt-4 text-2xl text-chambray ${bricolage_grot700.className}`}>
          {activeValue}
        </p>
        <p className={`mt-1 text-sm text-app-primary ${bricolage_grot600.className}`}>
          Active projects
        </p>
        <p className="mt-0.5 text-xs text-app-muted">{activeHint}</p>
      </Link>

      <ProjectCountListCard
        label="Top Picks"
        icon={Star}
        accent="bg-casablanca/15 text-chambray"
        projects={topPicksProjects}
        tab="top-picks"
        countLabel={(count) => pluralize(count, 'favorited file')}
        emptyMessage="No top picks yet"
        loading={loading}
        error={error}
        delayClass="portal-animate-in-delay-1"
      />

      <ProjectCountListCard
        label="Shared files"
        icon={FileText}
        accent="bg-chambray/10 text-chambray"
        projects={sharedFilesProjects}
        tab="files"
        countLabel={(count) => pluralize(count, 'file')}
        emptyMessage="No shared files yet"
        loading={loading}
        error={error}
        delayClass="portal-animate-in-delay-2"
      />
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

  const emptyStats = {
    activeProjects: 0,
    activeProjectsAwaitingReview: 0,
    topPicksCount: 0,
    sharedFiles: 0,
    lastSharedFileAt: null,
    projectsWithTopPicks: [],
    projectsWithSharedFiles: [],
  }

  const stats = statsData ?? (kpiLoading || kpiError ? null : emptyStats)
  const activeKpi = stats
    ? buildClientDashboardKpis(stats)[0]
    : {
        value: '—',
        hint: kpiError ? 'Could not load stats' : kpiLoading ? 'Loading…' : 'No data yet',
      }

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardKpiGrid
        activeValue={activeKpi.value}
        activeHint={activeKpi.hint}
        topPicksProjects={stats?.projectsWithTopPicks ?? []}
        sharedFilesProjects={stats?.projectsWithSharedFiles ?? []}
        loading={kpiLoading}
        error={kpiError}
      />
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
