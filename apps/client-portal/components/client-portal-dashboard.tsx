'use client'

import { Suspense, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import OrganizationLogo from '@/components/organization-logo'
import SocialListeningPanel from '@/components/social-listening/social-listening-panel'
import type { SocialListeningAnalyticsPayload } from '@/lib/social-listening/fetch-analytics'
import { alkatra600, bricolage_grot500, bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  CheckCircle2,
  FileText,
  FolderKanban,
  MessageSquare,
  Radio,
  Sparkles,
} from 'lucide-react'

type TabId = 'control-center' | 'social-listening'

const tabs: { id: TabId; label: string; shortLabel?: string }[] = [
  { id: 'control-center', label: 'Control Center' },
  { id: 'social-listening', label: 'Social Listening', shortLabel: 'Listening' },
]

const TAB_QUERY_KEY = 'tab'

function parseTabFromSearch(value: string | null): TabId {
  if (value === 'social-listening' || value === 'control-center') {
    return value
  }
  return 'control-center'
}

type ClientPortalDashboardProps = {
  userEmail: string
  organizationName: string | null
  organizationLogoUrl?: string | null
  hasSocialListening: boolean
  socialListeningAnalytics: SocialListeningAnalyticsPayload | null
}

export default function ClientPortalDashboard(props: ClientPortalDashboardProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <p className="text-sm text-slate-500">Loading portal…</p>
        </main>
      }
    >
      <ClientPortalDashboardContent {...props} />
    </Suspense>
  )
}

function ClientPortalDashboardContent({
  userEmail,
  organizationName,
  organizationLogoUrl,
  hasSocialListening,
  socialListeningAnalytics,
}: ClientPortalDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = parseTabFromSearch(searchParams.get(TAB_QUERY_KEY))

  const setActiveTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'control-center') {
        params.delete(TAB_QUERY_KEY)
      } else {
        params.set(TAB_QUERY_KEY, tab)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 opacity-[0.04]">
        <div className="h-48 w-48 rounded-full bg-chambray blur-3xl" />
      </div>

      <div className="relative">
        {organizationName ? (
          <div className="mb-5 flex items-center gap-3">
            <OrganizationLogo
              name={organizationName}
              logoUrl={organizationLogoUrl}
              size="md"
            />
            <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
              {organizationName}
            </p>
          </div>
        ) : null}
        <p className="portal-eyebrow">Client Portal</p>
        <h1 className={`portal-display mt-2 ${alkatra600.className}`}>Welcome back</h1>
        <p className={`mt-3 text-sm leading-relaxed text-slate-600 sm:text-base ${bricolage_grot500.className}`}>
          Signed in as{' '}
          <span className={`text-chambray ${bricolage_grot600.className}`}>{userEmail}</span>
          {organizationName ? (
            <>
              {' '}
              · <span className="text-sanmarino">{organizationName}</span>
            </>
          ) : null}
        </p>

        <div
          className="portal-surface mt-8 inline-flex w-full max-w-full flex-col gap-0.5 p-1 sm:inline-flex sm:w-auto sm:flex-row"
          role="tablist"
          aria-label="Portal sections"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                id={`portal-tab-${tab.id}`}
                className={`
                  rounded-[1.25rem] px-4 py-2.5 text-sm transition sm:px-6
                  ${bricolage_grot600.className}
                  ${
                    selected
                      ? 'bg-white text-chambray shadow-[0_4px_20px_rgba(57,65,154,0.12)] ring-1 ring-chambray/8'
                      : 'text-slate-600 hover:text-chambray'
                  }
                `}
              >
                <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6" role="tabpanel">
          {activeTab === 'control-center' ? (
            <ControlCenterPanel />
          ) : hasSocialListening && socialListeningAnalytics ? (
            <SocialListeningPanel analytics={socialListeningAnalytics} />
          ) : hasSocialListening ? (
            <p className="text-sm text-slate-500">
              Unable to load analytics. Try refreshing or contact CoCreate support.
            </p>
          ) : (
            <SocialListeningSubscribePanel organizationName={organizationName} />
          )}
        </div>
      </div>
    </main>
  )
}

function ControlCenterPanel() {
  const stats = [
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
  ]

  const activity = [
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
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="portal-surface-solid relative overflow-hidden p-5">
            <div
              className={`absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sanmarino/60 to-chambray/40`}
              aria-hidden
            />
            <div className={`mt-1 inline-flex rounded-2xl p-2.5 ${stat.accent}`}>
              <stat.icon className="h-5 w-5" aria-hidden />
            </div>
            <p className={`mt-4 text-2xl text-chambray ${bricolage_grot700.className}`}>
              {stat.value}
            </p>
            <p className={`mt-1 text-sm text-slate-800 ${bricolage_grot600.className}`}>
              {stat.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="portal-surface-solid p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="portal-eyebrow">Workspace</p>
            <h2 className={`mt-2 text-lg text-chambray sm:text-xl ${bricolage_grot600.className}`}>
              Project workspace
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Files, updates, and approvals from your CoCreate team will appear here.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Preview
          </span>
        </div>

        <ul className="mt-6 divide-y divide-chambray/6">
          {activity.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className={`text-slate-900 ${bricolage_grot600.className}`}>{item.title}</p>
                <p className="text-sm text-sanmarino">{item.project}</p>
              </div>
              <p className="text-xs text-slate-500 sm:text-sm">{item.time}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button type="button" className="portal-btn-ghost min-h-11 px-5 py-3">
            <FileText className="h-4 w-4" aria-hidden />
            View deliverables
          </button>
          <button type="button" className="portal-btn-primary min-h-11 gap-2">
            <MessageSquare className="h-4 w-4" aria-hidden />
            Message your team
          </button>
        </div>
      </section>
    </div>
  )
}

const listeningPlans = [
  {
    id: 'pulse',
    name: 'Pulse',
    price: '$149',
    period: '/ month',
    description: 'Essential monitoring for a focused brand footprint.',
    mentions: '5,000',
    alerts: '5',
    keywords: '10',
    users: '2',
    highlighted: false,
    features: [
      'Monthly mention volume cap',
      'Email alert digests',
      'Web + social sources',
      'Basic sentiment tags',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$349',
    period: '/ month',
    description: 'Most popular — scale mentions and real-time alerts.',
    mentions: '25,000',
    alerts: '25',
    keywords: '50',
    users: '5',
    highlighted: true,
    features: [
      'Everything in Pulse',
      'Real-time mention alerts',
      'Competitor keyword sets',
      'Sentiment & share-of-voice',
      'Exportable PDF reports',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$799',
    period: '/ month',
    description: 'High-volume listening for regional or multi-brand teams.',
    mentions: '100,000',
    alerts: 'Unlimited',
    keywords: '200',
    users: '15',
    highlighted: false,
    features: [
      'Everything in Growth',
      'Priority mention indexing',
      'Custom alert rules & webhooks',
      'Dedicated account support',
      'API access (coming soon)',
    ],
  },
] as const

function SocialListeningSubscribePanel({
  organizationName,
}: {
  organizationName: string | null
}) {
  return (
    <div className="space-y-8">
      <section className="portal-surface-solid overflow-hidden bg-linear-to-br from-white via-white to-sanmarino/[0.06] p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="inline-flex rounded-2xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-3 text-sanmarino ring-1 ring-sanmarino/15">
            <Radio className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="portal-eyebrow">Subscribe to unlock</p>
            <h2 className={`mt-2 text-xl text-chambray sm:text-2xl ${bricolage_grot600.className}`}>
              Social Listening
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Choose a plan based on how many{' '}
              <span className="font-medium text-chambray">mentions</span> and{' '}
              <span className="font-medium text-chambray">alerts</span> you need each
              month.
              {organizationName ? (
                <>
                  {' '}
                  Upgrades apply to{' '}
                  <span className="font-medium text-sanmarino">{organizationName}</span>.
                </>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {listeningPlans.map((plan) => (
          <article
            key={plan.id}
            className={`
              portal-surface-solid relative flex flex-col p-6
              ${
                plan.highlighted
                  ? 'ring-2 ring-sanmarino/25 shadow-[0_16px_48px_rgba(64,110,181,0.12)]'
                  : ''
              }
            `}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-casablanca to-casablanca/80 px-3 py-0.5 text-xs font-semibold tracking-wide text-chambray uppercase shadow-sm">
                Most popular
              </span>
            ) : null}

            <h3 className={`text-lg text-chambray ${bricolage_grot600.className}`}>{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{plan.description}</p>

            <p className="mt-6 flex items-baseline gap-1">
              <span className={`text-3xl text-chambray ${bricolage_grot700.className}`}>
                {plan.price}
              </span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-chambray/[0.04] p-4 text-sm ring-1 ring-chambray/6">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Mentions / mo
                </dt>
                <dd className="mt-0.5 font-semibold text-chambray">{plan.mentions}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Alerts
                </dt>
                <dd className="mt-0.5 font-semibold text-chambray">{plan.alerts}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Keywords
                </dt>
                <dd className="mt-0.5 font-semibold text-chambray">{plan.keywords}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Team seats
                </dt>
                <dd className="mt-0.5 font-semibold text-chambray">{plan.users}</dd>
              </div>
            </dl>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-sanmarino"
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`mt-8 w-full ${plan.highlighted ? 'portal-btn-primary' : 'portal-btn-ghost'}`}
            >
              Request {plan.name}
            </button>
          </article>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        Pricing is subject to change. Your CoCreate team will confirm availability,
        billing, and mention limits before activation.
      </p>
    </div>
  )
}

