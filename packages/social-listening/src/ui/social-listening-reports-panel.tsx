'use client'

import { useEffect, useRef, useState } from 'react'
import {
  useSocialListeningDataSource,
  type ReportTemplateMeta,
} from '@cocreate/social-listening/data-source'
import { slFontSemibold, slFontBold } from './typography'
import { FileDown } from 'lucide-react'

function partitionTemplates(templates: ReportTemplateMeta[]) {
  const deckTemplates = templates.filter((t) => t.format === 'deck')
  const letterTemplates = templates.filter((t) => t.format !== 'deck')
  return { letterTemplates, deckTemplates }
}

type SocialListeningReportsPanelProps = {
  snapshotDates: string[]
}

export default function SocialListeningReportsPanel({
  snapshotDates,
}: SocialListeningReportsPanelProps) {
  const dataSource = useSocialListeningDataSource()
  const [templates, setTemplates] = useState<ReportTemplateMeta[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [asOf, setAsOf] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<string | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const didDefaultTemplate = useRef(false)

  const dates = snapshotDates
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const latestDate = dates[0] ?? null
  const { letterTemplates, deckTemplates } = partitionTemplates(templates)
  const showFlatFallback =
    templates.length > 0 && letterTemplates.length === 0 && deckTemplates.length === 0
  const showTemplatesLoading = templatesLoading && templates.length === 0

  const renderTemplateButton = (template: ReportTemplateMeta) => {
    const active = template.id === selectedTemplateId
    return (
      <button
        key={template.id}
        type="button"
        onClick={() => setSelectedTemplateId(template.id)}
        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
          active
            ? 'border-sanmarino/50 bg-sanmarino/10 ring-1 ring-sanmarino/30'
            : 'border-app bg-app-input hover:border-sanmarino/30'
        }`}
      >
        <p className={`text-sm font-semibold text-chambray ${slFontSemibold}`}>
          {template.label}
        </p>
        <p className="mt-1 text-xs text-app-muted">{template.description}</p>
        <p className="mt-2 text-xs font-medium text-sanmarino">{template.pageHint}</p>
      </button>
    )
  }

  useEffect(() => {
    let cancelled = false
    setTemplatesLoading(true)
    setTemplatesError(null)

    void dataSource.fetchReportTemplates().then((templateResult) => {
      if (cancelled) return

      setTemplatesLoading(false)

      if (templateResult.ok) {
        setTemplates(templateResult.templates)
        if (templateResult.templates.length && !didDefaultTemplate.current) {
          didDefaultTemplate.current = true
          setSelectedTemplateId(templateResult.templates[0]!.id)
        }
      } else {
        setTemplates([])
        setTemplatesError(templateResult.message)
      }
    })

    return () => {
      cancelled = true
    }
  }, [dataSource])

  const handleDownload = async () => {
    if (!selectedTemplateId) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await dataSource.downloadReport({
      templateId: selectedTemplateId,
      asOf: asOf ?? undefined,
      baseline: selectedTemplate?.supportsCompare ? baseline ?? undefined : undefined,
      current:
        selectedTemplate?.supportsCompare && current
          ? current
          : selectedTemplate?.supportsCompare
            ? undefined
            : undefined,
    })

    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setSuccess('PDF downloaded successfully.')
  }

  return (
    <div className="space-y-6">
      <section className="portal-glass-card p-6 sm:p-8">
        <p className="portal-eyebrow">Reports</p>
        <h3
          className={`mt-2 text-xl text-chambray sm:text-2xl ${slFontBold}`}
        >
          Export PDF presentations
        </h3>
        <p
          className={`mt-2 max-w-2xl text-sm leading-relaxed text-app-muted ${slFontSemibold}`}
        >
          Choose a template and snapshot date. PDF exports require a Growth or Scale plan.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="portal-glass-card space-y-4 p-5 lg:col-span-5">
          <h4 className={`text-sm font-semibold text-chambray ${slFontSemibold}`}>
            Templates
          </h4>
          {showTemplatesLoading ? (
            <p className="text-sm text-app-muted">Loading templates…</p>
          ) : templatesError ? (
            <div className="space-y-2">
              <p className="portal-alert-error">{templatesError}</p>
              <p className="text-xs text-app-muted">
                If templates still do not appear, rebuild the reports package and restart
                the API:{' '}
                <code className="rounded bg-app-input px-1 py-0.5 text-[11px]">
                  pnpm --filter @cocreate/social-listening-reports build
                </code>
              </p>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-app-muted">
              No report templates are available.
            </p>
          ) : (
            <div className="space-y-5">
              {letterTemplates.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                    Print reports (Letter)
                  </p>
                  <div className="space-y-3">
                    {letterTemplates.map(renderTemplateButton)}
                  </div>
                </div>
              ) : null}
              {deckTemplates.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                    Presentation decks (16:9)
                  </p>
                  <div className="space-y-3">
                    {deckTemplates.map(renderTemplateButton)}
                  </div>
                </div>
              ) : null}
              {showFlatFallback ? (
                <div className="space-y-3">{templates.map(renderTemplateButton)}</div>
              ) : null}
            </div>
          )}
        </section>

        <section className="portal-glass-card space-y-4 p-5 lg:col-span-7">
          <h4 className={`text-sm font-semibold text-chambray ${slFontSemibold}`}>
            Options
          </h4>

          <label className="flex flex-col gap-1 text-xs text-app-muted">
            <span className="font-semibold uppercase tracking-wide text-app-muted">
              Snapshot date
            </span>
            <select
              className="portal-input rounded-lg py-2 text-sm"
              value={asOf ?? ''}
              onChange={(e) => setAsOf(e.target.value || null)}
            >
              <option value="">
                {latestDate ? `Latest (${latestDate})` : 'Latest'}
              </option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          {selectedTemplate?.supportsCompare ? (
            <>
              <label className="flex flex-col gap-1 text-xs text-app-muted">
                <span className="font-semibold uppercase tracking-wide text-app-muted">
                  Baseline date
                </span>
                <select
                  className="portal-input rounded-lg py-2 text-sm"
                  value={baseline ?? ''}
                  onChange={(e) => setBaseline(e.target.value || null)}
                >
                  <option value="">Select baseline…</option>
                  {dates
                    .filter((d) => d !== (asOf ?? latestDate))
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-app-muted">
                <span className="font-semibold uppercase tracking-wide text-app-muted">
                  Current date (optional)
                </span>
                <select
                  className="portal-input rounded-lg py-2 text-sm"
                  value={current ?? ''}
                  onChange={(e) => setCurrent(e.target.value || null)}
                >
                  <option value="">Latest snapshot</option>
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {error ? (
            <p className="portal-alert-error">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {success}
            </p>
          ) : null}

          <button
            type="button"
            disabled={
              loading ||
              showTemplatesLoading ||
              !!templatesError ||
              !selectedTemplateId ||
              (selectedTemplate?.supportsCompare && !baseline)
            }
            onClick={() => void handleDownload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-chambray px-5 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            {loading ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </section>
      </div>
    </div>
  )
}
