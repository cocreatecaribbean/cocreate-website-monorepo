'use client'

import Link from 'next/link'
import ControlCenterApprovalsView from '@/components/control-center/control-center-approvals-view'
import ControlCenterProjectsView from '@/components/control-center/control-center-projects-view'
import PortalSectionPlaceholder from '@/components/portal/section-placeholder'
import { ATTENTION_PAGE_PATH } from '@/lib/control-center/attention-items'
import type { ControlCenterViewId } from '@/lib/control-center/nav'
import { alkatra600, bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  FolderKanban,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react'

const STATS = [
  {
    label: 'Active projects',
    value: '2',
    hint: '1 awaiting your review',
    icon: FolderKanban,
    accent: 'bg-sanmarino/10 text-sanmarino',
  },
  {
    label: 'Pending approvals',
    value: '3',
    hint: 'Due this week',
    icon: CheckCircle2,
    accent: 'bg-casablanca/15 text-chambray',
  },
  {
    label: 'Shared files',
    value: '14',
    hint: 'Last upload yesterday',
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
    project: 'Island Fresh rebrand',
    time: '2 hours ago',
  },
  {
    title: 'Q2 campaign storyboard uploaded',
    project: 'Tourism board social',
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
}

export default function ControlCenterContent({ activeView }: ControlCenterContentProps) {
  switch (activeView) {
    case 'overview':
      return <OverviewSection />
    case 'projects':
      return <ControlCenterProjectsView />
    case 'approvals':
      return <ControlCenterApprovalsView />
    case 'files':
      return <FilesSection />
    case 'activity':
      return <ActivitySection />
    case 'messages':
      return <MessagesSection />
    case 'settings':
      return (
        <PortalSectionPlaceholder
          title="Settings"
          description="Manage email notifications, default project view, and team access preferences."
          icon={Settings}
        />
      )
    default:
      return <OverviewSection />
  }
}

function KpiGrid({ delayOffset = 0 }: { delayOffset?: number }) {
  const delays = ['', 'portal-animate-in-delay-1', 'portal-animate-in-delay-2'] as const
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {STATS.map((stat, i) => (
        <article
          key={stat.label}
          className={`portal-glass-kpi portal-shine-hover portal-animate-in relative overflow-hidden p-5 ${delays[i + delayOffset] ?? ''}`}
        >
          <div
            className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sanmarino/60 to-chambray/40"
            aria-hidden
          />
          <div className={`mt-1 inline-flex rounded-2xl p-2.5 ${stat.accent}`}>
            <stat.icon className="h-5 w-5" aria-hidden />
          </div>
          <p className={`mt-4 text-2xl text-chambray ${bricolage_grot700.className}`}>{stat.value}</p>
          <p className={`mt-1 text-sm text-slate-800 ${bricolage_grot600.className}`}>{stat.label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{stat.hint}</p>
        </article>
      ))}
    </section>
  )
}

function OverviewSection() {
  return (
    <div className="space-y-6">
      <KpiGrid />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="portal-glass-card portal-animate-in portal-animate-in-delay-3 p-6">
          <p className="portal-eyebrow">Quick actions</p>
          <h3 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            What needs you today
          </h3>
          <p className="mt-4 text-sm text-slate-600">
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
                <p className={`text-sm text-slate-900 ${bricolage_grot600.className}`}>{item.title}</p>
                <p className="text-xs text-sanmarino">{item.project}</p>
                <p className="mt-1 text-xs text-slate-500">{item.time}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <PreviewBanner />
    </div>
  )
}

function FilesSection() {
  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-animate-in overflow-hidden">
        <div className="hidden border-b border-chambray/8 bg-white/40 px-5 py-3 text-xs font-medium tracking-wide text-slate-500 uppercase sm:grid sm:grid-cols-[1fr_140px_100px_80px] sm:gap-4">
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
              <p className="text-xs text-slate-500">{file.updated}</p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="text-xs text-slate-500">{file.size}</span>
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
                <p className={`text-slate-900 ${bricolage_grot600.className}`}>{item.title}</p>
                <p className="text-sm text-sanmarino">{item.project}</p>
              </div>
              <p className="text-xs text-slate-500 sm:text-sm">{item.time}</p>
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
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
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
        <p className={`text-sm text-slate-600 ${bricolage_grot600.className}`}>
          Common topics
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Project timeline', 'File feedback', 'Billing question', 'New request'].map(
            (topic) => (
              <button
                key={topic}
                type="button"
                className="rounded-full border border-chambray/10 bg-white px-4 py-2 text-sm text-chambray transition hover:border-sanmarino/30 hover:text-sanmarino"
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

function PreviewBanner() {
  return (
    <p className="flex items-center justify-center gap-2 text-center text-xs tracking-wide text-slate-400 uppercase">
      <Sparkles className="h-3.5 w-3.5 text-sanmarino" aria-hidden />
      Preview workspace · Live data coming soon
    </p>
  )
}
