'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSocialListeningDataSource, type SocialListeningDataSource } from '@client-portal/lib/social-listening/data-source'
import { bricolage_grot600, bricolage_grot700 } from '@client-portal/styles/fonts'
import { FileDown } from 'lucide-react'

export default function SocialListeningReportsPanel() {
  const dataSource = useSocialListeningDataSource()
  const [templates, setTemplates] = useState<
    Awaited<ReturnType<SocialListeningDataSource['fetchReportTemplates']>>
  >([])
  const [dates, setDates] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [asOf, setAsOf] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<string | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const latestDate = dates[0] ?? null

  const loadMeta = useCallback(async () => {
    const [templateList, dateList] = await Promise.all([
      dataSource.fetchReportTemplates(),
      dataSource.fetchSnapshotDates(),
    ])
    setTemplates(templateList)
    setDates(dateList)
    if (templateList.length && !selectedTemplateId) {
      setSelectedTemplateId(templateList[0]!.id)
    }
  }, [dataSource, selectedTemplateId])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

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
          className={`mt-2 text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
        >
          Export PDF presentations
        </h3>
        <p
          className={`mt-2 max-w-2xl text-sm leading-relaxed text-app-muted ${bricolage_grot600.className}`}
        >
          Choose a template and snapshot date. Reports use saved snapshot data from
          your reporting period.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="portal-glass-card space-y-4 p-5 lg:col-span-5">
          <h4 className={`text-sm font-semibold text-chambray ${bricolage_grot600.className}`}>
            Templates
          </h4>
          <div className="space-y-3">
            {templates.map((template) => {
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
                  <p className={`text-sm font-semibold text-chambray ${bricolage_grot600.className}`}>
                    {template.label}
                  </p>
                  <p className="mt-1 text-xs text-app-muted">{template.description}</p>
                  <p className="mt-2 text-xs font-medium text-sanmarino">{template.pageHint}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="portal-glass-card space-y-4 p-5 lg:col-span-7">
          <h4 className={`text-sm font-semibold text-chambray ${bricolage_grot600.className}`}>
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
