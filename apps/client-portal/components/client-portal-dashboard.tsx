'use client'

import { useState } from 'react'
import OrganizationLogo from '@/components/organization-logo'
import {
  BarChart3,
  CheckCircle2,
  FileText,
  FolderKanban,
  MessageSquare,
  Radio,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

type TabId = 'control-center' | 'social-listening'

const tabs: { id: TabId; label: string }[] = [
  { id: 'control-center', label: 'Control Center' },
  { id: 'social-listening', label: 'Social Listening / Analytics' },
]

type ClientPortalDashboardProps = {
  userEmail: string
  organizationName: string | null
  organizationLogoUrl?: string | null
  hasSocialListening: boolean
}

export default function ClientPortalDashboard({
  userEmail,
  organizationName,
  organizationLogoUrl,
  hasSocialListening,
}: ClientPortalDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('control-center')

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 opacity-[0.04]">
        <div className="h-48 w-48 rounded-full bg-chambray blur-3xl" />
      </div>

      <div className="relative">
        {organizationName ? (
          <div className="mb-4 flex items-center gap-3">
            <OrganizationLogo
              name={organizationName}
              logoUrl={organizationLogoUrl}
              size="md"
            />
            <p className="text-sm font-medium text-chambray">{organizationName}</p>
          </div>
        ) : null}
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sanmarino">
          Client Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-chambray sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Signed in as{' '}
          <span className="font-semibold text-chambray">{userEmail}</span>
          {organizationName ? (
            <>
              {' '}
              · <span className="text-sanmarino">{organizationName}</span>
            </>
          ) : null}
        </p>

        <div
          className="mt-8 inline-flex w-full max-w-full flex-col gap-1 rounded-2xl border border-chambray/10 bg-white/70 p-1 shadow-sm backdrop-blur-sm sm:inline-flex sm:w-auto sm:flex-row"
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
                className={`
                  rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition sm:px-5 sm:text-center
                  ${
                    selected
                      ? 'bg-chambray text-white shadow-sm'
                      : 'text-chambray hover:bg-chambray/5'
                  }
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6" role="tabpanel">
          {activeTab === 'control-center' ? (
            <ControlCenterPanel />
          ) : hasSocialListening ? (
            <SocialListeningPanel />
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
          <article
            key={stat.label}
            className="rounded-3xl border border-chambray/10 bg-white p-5 shadow-sm"
          >
            <div
              className={`inline-flex rounded-2xl p-2.5 ${stat.accent}`}
            >
              <stat.icon className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-4 text-2xl font-semibold text-chambray">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{stat.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-chambray/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-chambray">Project workspace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Files, updates, and approvals from your CoCreate team will appear here.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Mockup preview
          </span>
        </div>

        <ul className="mt-6 divide-y divide-chambray/8">
          {activity.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-sanmarino">{item.project}</p>
              </div>
              <p className="text-xs text-slate-500 sm:text-sm">{item.time}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-chambray/15 px-5 py-3 text-sm font-semibold text-chambray transition hover:border-sanmarino hover:bg-sanmarino/5"
          >
            <FileText className="h-4 w-4" aria-hidden />
            View deliverables
          </button>
          <button
            type="button"
            className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-chambray px-5 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino"
          >
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
      <section className="rounded-3xl border border-chambray/10 bg-linear-to-br from-white via-white to-sanmarino/5 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="inline-flex rounded-2xl bg-sanmarino/10 p-3 text-sanmarino">
            <Radio className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-sanmarino">
              Subscribe to unlock
            </p>
            <h2 className="mt-1 text-xl font-semibold text-chambray sm:text-2xl">
              Social Listening / Analytics
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Choose a plan based on how many{' '}
              <span className="font-medium text-chambray">mentions</span> and{' '}
              <span className="font-medium text-chambray">alerts</span> you need each
              month — similar to how tools like Brand24 tier their packages.
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
              relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm
              ${
                plan.highlighted
                  ? 'border-sanmarino ring-2 ring-sanmarino/20'
                  : 'border-chambray/10'
              }
            `}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-casablanca px-3 py-0.5 text-xs font-semibold text-chambray">
                Most popular
              </span>
            ) : null}

            <h3 className="text-lg font-semibold text-chambray">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{plan.description}</p>

            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-chambray">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#f4f6fb] p-4 text-sm">
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
              className={`
                mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition
                ${
                  plan.highlighted
                    ? 'bg-chambray text-white hover:bg-sanmarino'
                    : 'border border-chambray/15 text-chambray hover:border-sanmarino hover:bg-sanmarino/5'
                }
              `}
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

function SocialListeningPanel() {
  const metrics = [
    { label: 'Reach (30d)', value: '128K', change: '+12%' },
    { label: 'Engagement rate', value: '4.8%', change: '+0.6 pts' },
    { label: 'Brand mentions', value: '342', change: '+28' },
    { label: 'Sentiment score', value: '82', change: 'Positive' },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-chambray/10 bg-linear-to-br from-white via-white to-sanmarino/5 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="inline-flex rounded-2xl bg-sanmarino/10 p-3 text-sanmarino">
            <Radio className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-chambray">
              Social Listening / Analytics
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              Monitor brand mentions, campaign performance, and audience sentiment
              across your key channels. This view is a mockup of the premium tier.
            </p>
          </div>
          <span className="rounded-full bg-casablanca/20 px-3 py-1 text-xs font-semibold text-chambray">
            Premium
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-3xl border border-chambray/10 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-chambray">{metric.value}</p>
            <p className="mt-1 text-sm font-medium text-emerald-700">{metric.change}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-3xl border border-chambray/10 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-chambray">Engagement trend</h3>
            <BarChart3 className="h-5 w-5 text-sanmarino" aria-hidden />
          </div>
          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-1">
            {[42, 58, 45, 72, 68, 85, 78, 92, 88, 95, 82, 100].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-linear-to-t from-chambray to-sanmarino opacity-90"
                style={{ height: `${height}%` }}
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Last 12 weeks · sample data
          </p>
        </article>

        <article className="rounded-3xl border border-chambray/10 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sanmarino" aria-hidden />
            <h3 className="font-semibold text-chambray">Top channels</h3>
          </div>
          <ul className="mt-6 space-y-4">
            {[
              { name: 'Instagram', share: 48 },
              { name: 'Facebook', share: 28 },
              { name: 'LinkedIn', share: 16 },
              { name: 'X / Twitter', share: 8 },
            ].map((channel) => (
              <li key={channel.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{channel.name}</span>
                  <span className="text-slate-500">{channel.share}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-chambray/10">
                  <div
                    className="h-full rounded-full bg-sanmarino"
                    style={{ width: `${channel.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}
