'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import SocialListeningDashboard from '@client-portal/components/social-listening/social-listening-dashboard'
import SocialListeningHistoryBar from '@client-portal/components/social-listening/social-listening-history-bar'
import SocialListeningLayout from '@client-portal/components/social-listening/social-listening-layout'
import type { SocialListeningAnalyticsPayload } from '@client-portal/lib/social-listening/api-types'
import type { SocialListeningComparePayload } from '@client-portal/lib/social-listening/api-types'
import {
  SocialListeningDataSourceProvider,
  useSocialListeningDataSource,
  type SocialListeningDataSource,
} from '@client-portal/lib/social-listening/data-source'
import { clientSocialListeningDataSource } from '@client-portal/lib/social-listening/client-data-source'
import { buildMentionSnapshotHint } from '@client-portal/lib/social-listening/mention-snapshot-hint'
import { normalizeSocialListeningAnalytics } from '@client-portal/lib/social-listening/normalize-analytics'
import { alkatra600, bricolage_grot600 } from '@client-portal/styles/fonts'

type SocialListeningPanelProps = {
  initialAnalytics: SocialListeningAnalyticsPayload
  organizationName?: string | null
  dataSource?: SocialListeningDataSource
  variant?: 'client' | 'admin'
  adminBanner?: string | null
  showSetup?: boolean
  showSettings?: boolean
  renderSettingsPanel?: () => ReactNode
}

function normalizePayload(
  payload: SocialListeningAnalyticsPayload,
): SocialListeningAnalyticsPayload {
  const data = normalizeSocialListeningAnalytics(payload.data)
  if (!data) return payload
  return { ...payload, data }
}

function SocialListeningPanelInner({
  initialAnalytics,
  organizationName,
  variant = 'client',
  adminBanner,
  showSetup = true,
  showSettings = true,
  renderSettingsPanel,
}: Omit<SocialListeningPanelProps, 'dataSource'>) {
  const dataSource = useSocialListeningDataSource()
  const [analytics, setAnalytics] = useState<SocialListeningAnalyticsPayload>(() =>
    normalizePayload(initialAnalytics),
  )
  const [compare, setCompare] = useState<SocialListeningComparePayload | null>(null)
  const [asOf, setAsOf] = useState<string | null>(null)
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [compareBaseline, setCompareBaseline] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const skipInitialLatestFetch = useRef(true)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    setError(null)

    const result = await dataSource.fetchAnalyticsWithStatus(
      asOf ? { asOf } : undefined,
    )

    if (result.status === 'not_found') {
      setNotFound(true)
      setLoading(false)
      return
    }

    if (result.status !== 'ok') {
      setError('Unable to load analytics.')
      setLoading(false)
      return
    }

    setAnalytics(normalizePayload(result.payload))
    setLoading(false)
  }, [asOf, dataSource])

  const loadCompare = useCallback(async () => {
    if (!compareEnabled || !compareBaseline) {
      setCompare(null)
      return
    }

    const result = await dataSource.fetchCompare({
      baseline: compareBaseline,
      current: asOf ?? undefined,
    })
    setCompare(result)
  }, [compareEnabled, compareBaseline, asOf, dataSource])

  useEffect(() => {
    if (!asOf && skipInitialLatestFetch.current) {
      skipInitialLatestFetch.current = false
      return
    }
    void loadAnalytics()
  }, [asOf, loadAnalytics])

  useEffect(() => {
    void loadCompare()
  }, [loadCompare])

  const isMock = analytics.meta.source === 'org_mock'
  const totalMentions = analytics.data.sentimentSummary.reduce(
    (sum, slice) => sum + slice.value,
    0,
  )
  const mentionHint = buildMentionSnapshotHint(
    totalMentions,
    analytics.meta.snapshotDate ?? asOf,
  )
  const snapshotLabel = asOf
    ? `Snapshot · ${analytics.meta.snapshotDate ?? asOf}`
    : analytics.meta.snapshotDate
      ? `Latest · ${analytics.meta.snapshotDate}`
      : 'Latest'

  return (
    <div className="portal-sl-region space-y-6">
      {variant === 'admin' ? (
        <div className="admin-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          {adminBanner ? (
            <p className={`text-sm text-app-muted ${bricolage_grot600.className}`}>
              {adminBanner}
            </p>
          ) : null}
          <span className="inline-flex shrink-0 items-center rounded-full border border-chambray/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-app-muted">
            {isMock ? 'Mock · per org' : 'Live'} · {snapshotLabel}
          </span>
        </div>
      ) : (
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
                className={`brand-gradient-text mt-2 bg-linear-to-r from-chambray via-sanmarino to-chambray bg-clip-text text-xl text-transparent sm:text-2xl ${alkatra600.className}`}
              >
                Social Listening
              </h2>
              <p
                className={`mt-2 max-w-2xl text-sm leading-relaxed portal-sl-secondary ${bricolage_grot600.className}`}
              >
                Tune into the global conversation. Use the sidebar to jump between mentions,
                summary, sources, and more. Pick a saved date to compare trends over time.
              </p>
            </div>
            <span className="portal-sl-hero-badge inline-flex shrink-0 items-center rounded-full border border-casablanca/40 bg-linear-to-r from-casablanca/35 to-sanmarino/15 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase shadow-sm backdrop-blur-md ring-1 ring-white/60 dark:from-casablanca/30 dark:to-casablanca/10 dark:ring-casablanca/25">
              {isMock ? 'Mock · per org' : 'Live'} · {snapshotLabel}
            </span>
          </div>
        </section>
      )}

      <SocialListeningHistoryBar
        asOf={asOf}
        compareEnabled={compareEnabled}
        compareBaseline={compareBaseline}
        onAsOfChange={setAsOf}
        onCompareEnabledChange={setCompareEnabled}
        onCompareBaselineChange={setCompareBaseline}
      />

      {loading ? (
        <p className="portal-sl-secondary text-center text-sm">Loading analytics…</p>
      ) : null}

      {notFound ? (
        <div className="portal-glass-card rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          No data saved for this date yet. Choose Latest or another date from the list.
        </div>
      ) : null}

      {error ? <div className="portal-alert-error">{error}</div> : null}

      {!loading && !notFound && !error ? (
        <section className="portal-sl-frame portal-animate-in portal-animate-in-delay-1 overflow-hidden">
          <SocialListeningLayout
            organizationName={organizationName}
            mentionHint={mentionHint}
            showSettings={showSettings}
            showSetupShortcut={showSetup}
          >
            {(activeView, settingsOpen) => (
              <SocialListeningDashboard
                data={analytics.data}
                activeView={activeView}
                settingsOpen={settingsOpen}
                metaSource={analytics.meta.source}
                compareDeltas={compare?.deltas ?? null}
                comparePayload={compare}
                compareBaselineDate={compare?.baseline.date}
                compareCurrentDate={compare?.current.date}
                showSetup={showSetup}
                renderSettingsPanel={renderSettingsPanel}
                onSetupComplete={() => {
                  setAsOf(null)
                  skipInitialLatestFetch.current = false
                  void loadAnalytics()
                }}
              />
            )}
          </SocialListeningLayout>
        </section>
      ) : null}
    </div>
  )
}

export default function SocialListeningPanel({
  dataSource = clientSocialListeningDataSource,
  ...props
}: SocialListeningPanelProps) {
  return (
    <SocialListeningDataSourceProvider value={dataSource}>
      <SocialListeningPanelInner {...props} />
    </SocialListeningDataSourceProvider>
  )
}
