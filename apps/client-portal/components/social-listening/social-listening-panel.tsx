'use client'

import SocialListeningDashboard from '@/components/social-listening/social-listening-dashboard'
import type { SocialListeningAnalyticsPayload } from '@/lib/social-listening/fetch-analytics'
import { alkatra600, bricolage_grot600 } from '@/styles/fonts'

type SocialListeningPanelProps = {
  analytics: SocialListeningAnalyticsPayload
}

export default function SocialListeningPanel({ analytics }: SocialListeningPanelProps) {
  const isMock = analytics.meta.source === 'org_mock'

  return (
    <div className="space-y-8">
      <section className="portal-glass-card portal-gradient-hero portal-shine-hover portal-animate-in relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-casablanca/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-sanmarino/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="portal-eyebrow">Analytics</p>
            <h2
              className={`mt-2 bg-linear-to-r from-chambray via-sanmarino to-chambray bg-clip-text text-xl text-transparent sm:text-2xl ${alkatra600.className}`}
            >
              Social Listening
            </h2>
            <p className={`mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 ${bricolage_grot600.className}`}>
              Tune into the global conversation. Our platform filters out the noise to deliver the
              raw, real-time insights your brand needs to move with purpose and impact.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-casablanca/40 bg-linear-to-r from-casablanca/35 to-sanmarino/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-chambray uppercase shadow-sm backdrop-blur-md ring-1 ring-white/60">
            {isMock ? 'Mock · per org' : 'Live'}
          </span>
        </div>
      </section>

      <SocialListeningDashboard
        data={analytics.data}
        metaSource={analytics.meta.source}
      />
    </div>
  )
}
