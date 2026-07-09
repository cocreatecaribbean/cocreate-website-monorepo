'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type {
  GenerateThreadSummaryResponse,
  ThreadSummaryClientFeedback,
  ThreadSummaryDeliverable,
  ThreadSummaryPayload,
  ThreadSummaryReferencedFilePayload,
} from '@cocreate/api-contracts/v1/shared/thread-summary'

export type FetchAttachmentDownloadUrl = (
  attachmentId: string,
) => Promise<string | null>

export type ThreadSummaryExportProps = {
  onGenerate: (options?: { force?: boolean }) => Promise<GenerateThreadSummaryResponse>
  onExportPdf: (options?: { force?: boolean }) => Promise<void>
  fetchAttachmentDownloadUrl?: FetchAttachmentDownloadUrl
  triggerClassName?: string
  panelClassName?: string
  primaryButtonClassName?: string
  ghostButtonClassName?: string
  disabled?: boolean
}

const LOADING_MESSAGES = [
  'Reading your messages…',
  'Extracting deliverables and feedback…',
  'Building your visual briefing…',
] as const

function SummarySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide text-chambray uppercase">
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-app-muted">{children}</div>
    </section>
  )
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-chambray/15 border-t-sanmarino"
        aria-hidden
      />
      <div className="space-y-2">
        <p className="text-base font-medium text-chambray">{message}</p>
        <p className="text-sm text-app-muted">
          This usually takes a few seconds. We&apos;re putting together a detailed briefing with
          deliverables, client feedback, and file previews.
        </p>
      </div>
      <div className="mt-2 w-full max-w-sm space-y-2">
        <div className="h-2 animate-pulse rounded-full bg-chambray/10" />
        <div className="h-2 animate-pulse rounded-full bg-chambray/10 [animation-delay:120ms]" />
        <div className="h-2 w-4/5 animate-pulse rounded-full bg-chambray/10 [animation-delay:240ms]" />
      </div>
    </div>
  )
}

function DeliverableCard({ item }: { item: ThreadSummaryDeliverable }) {
  return (
    <div className="rounded-xl border border-chambray/10 bg-white/30 p-3 dark:bg-white/5">
      <p className="font-medium text-chambray">{item.title}</p>
      <p className="mt-1">{item.detail}</p>
      {item.presentedBy || item.date ? (
        <p className="mt-2 text-xs font-medium text-sanmarino">
          {[item.presentedBy, item.date].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </div>
  )
}

function FeedbackCard({ item }: { item: ThreadSummaryClientFeedback }) {
  return (
    <div className="rounded-xl border border-chambray/10 bg-white/30 p-3 dark:bg-white/5">
      <p>{item.request}</p>
      {item.relatedTo ? (
        <p className="mt-1 text-xs text-app-muted">Re: {item.relatedTo}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
        {item.requestedBy ? (
          <span className="text-chambray">{item.requestedBy}</span>
        ) : null}
        {item.date ? <span className="text-sanmarino">{item.date}</span> : null}
        {item.status ? (
          <span className="rounded-full bg-chambray/8 px-2 py-0.5 capitalize text-chambray">
            {item.status.replace('_', ' ')}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function formatVisualMeta(file: ThreadSummaryReferencedFilePayload): string | null {
  const parts = [file.sharedBy, file.sharedRole, file.sharedAt].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

function ConversationVisualCard({
  file,
  fetchDownloadUrl,
}: {
  file: ThreadSummaryReferencedFilePayload
  fetchDownloadUrl: FetchAttachmentDownloadUrl
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const meta = formatVisualMeta(file)
  const showCaption =
    file.caption &&
    file.caption.trim() !== (file.messageBody ?? '').trim()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchDownloadUrl(file.attachmentId).then((nextUrl) => {
      if (cancelled) return
      setUrl(nextUrl)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [file.attachmentId, fetchDownloadUrl])

  return (
    <article className="overflow-hidden rounded-xl border border-chambray/10 bg-white/40 dark:bg-white/5">
      {loading ? (
        <div className="flex h-48 animate-pulse items-center justify-center bg-chambray/5" />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.fileName}
          className="max-h-64 w-full object-contain bg-chambray/5"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-chambray/5 text-sm text-app-muted">
          Preview unavailable
        </div>
      )}
      <div className="space-y-2 p-4">
        {meta ? (
          <p className="text-xs font-semibold tracking-wide text-sanmarino uppercase">
            {meta}
          </p>
        ) : null}
        {file.messageBody ? (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {file.messageBody}
          </p>
        ) : (
          <p className="text-sm text-app-muted">{file.fileName}</p>
        )}
        {showCaption ? (
          <p className="text-xs leading-relaxed text-app-muted italic">{file.caption}</p>
        ) : null}
      </div>
    </article>
  )
}

function OtherFileRow({
  file,
  fetchDownloadUrl,
}: {
  file: ThreadSummaryReferencedFilePayload
  fetchDownloadUrl: FetchAttachmentDownloadUrl
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchDownloadUrl(file.attachmentId).then((nextUrl) => {
      if (cancelled) return
      setUrl(nextUrl)
    })
    return () => {
      cancelled = true
    }
  }, [file.attachmentId, fetchDownloadUrl])

  const meta = formatVisualMeta(file)

  return (
    <div className="rounded-xl border border-chambray/10 bg-white/30 p-3 dark:bg-white/5">
      <p className="text-sm font-medium text-chambray">{file.fileName}</p>
      {meta ? <p className="mt-1 text-xs text-sanmarino">{meta}</p> : null}
      {file.messageBody ? (
        <p className="mt-2 text-sm leading-relaxed">{file.messageBody}</p>
      ) : null}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-medium text-sanmarino hover:text-chambray"
        >
          Download file
        </a>
      ) : null}
    </div>
  )
}

export default function ThreadSummaryExport({
  onGenerate,
  onExportPdf,
  fetchAttachmentDownloadUrl,
  triggerClassName = 'portal-btn-ghost shrink-0 px-3 py-1.5 text-xs',
  panelClassName = 'portal-glass-card',
  primaryButtonClassName = 'portal-btn-primary px-4 py-2 text-sm',
  ghostButtonClassName = 'portal-btn-ghost px-4 py-2 text-sm',
  disabled = false,
}: ThreadSummaryExportProps) {
  const dialogId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<ThreadSummaryPayload | null>(null)
  const [cached, setCached] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  const close = useCallback(() => {
    setOpen(false)
    dialogRef.current?.close()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0)
      return
    }

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length)
    }, 2200)

    return () => window.clearInterval(interval)
  }, [loading])

  const runGenerate = useCallback(
    async (force = false) => {
      setLoading(true)
      setError(null)
      setOpen(true)
      try {
        const result = await onGenerate({ force })
        setSummary(result.summary)
        setCached(result.cached)
      } catch (err) {
        setSummary(null)
        setError(err instanceof Error ? err.message : 'Could not generate summary.')
      } finally {
        setLoading(false)
      }
    },
    [onGenerate],
  )

  const runExport = useCallback(async () => {
    setExporting(true)
    setError(null)
    try {
      await onExportPdf({ force: !cached })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download PDF.')
    } finally {
      setExporting(false)
    }
  }, [cached, onExportPdf])

  const loadingMessage = LOADING_MESSAGES[loadingMessageIndex] ?? LOADING_MESSAGES[0]

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        disabled={disabled || loading}
        onClick={() => void runGenerate(false)}
      >
        {loading ? 'Analyzing…' : 'Summary'}
      </button>

      {error && !open ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        id={dialogId}
        className={`${panelClassName} fixed top-1/2 left-1/2 z-50 m-0 w-[min(48rem,calc(100vw-2rem))] max-h-[min(85dvh,760px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden border-0 p-0 backdrop:bg-chambray/40`}
        onClose={() => setOpen(false)}
      >
        {loading ? (
          <LoadingPanel message={loadingMessage} />
        ) : summary ? (
          <div className="flex max-h-[min(85dvh,760px)] flex-col">
            <div className="border-b border-chambray/10 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-chambray">Thread summary</p>
                  <p className="mt-1 text-sm text-app-muted">{summary.title}</p>
                  {summary.subtitle ? (
                    <p className="mt-0.5 text-xs text-app-muted">{summary.subtitle}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={ghostButtonClassName}
                  onClick={close}
                  aria-label="Close summary"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-xs text-app-muted">
                {summary.messageCount} messages ·{' '}
                {cached ? 'Loaded from cache' : 'Freshly generated'}
                {summary.truncated ? ' · Based on recent 500 messages' : ''}
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              <SummarySection title="Overview">
                <p className="text-base leading-7 text-slate-700 dark:text-slate-200">
                  {summary.overview}
                </p>
              </SummarySection>

              {summary.deliverablesPresented.length > 0 ? (
                <SummarySection title="What we presented">
                  <div className="space-y-3">
                    {summary.deliverablesPresented.map((item) => (
                      <DeliverableCard
                        key={`${item.title}-${item.date ?? 'na'}`}
                        item={item}
                      />
                    ))}
                  </div>
                </SummarySection>
              ) : null}

              {summary.clientFeedback.length > 0 ? (
                <SummarySection title="Client feedback & changes">
                  <div className="space-y-3">
                    {summary.clientFeedback.map((item) => (
                      <FeedbackCard
                        key={`${item.request}-${item.date ?? 'na'}`}
                        item={item}
                      />
                    ))}
                  </div>
                </SummarySection>
              ) : null}

              {summary.timeline.length > 0 ? (
                <SummarySection title="What happened">
                  <div className="space-y-3">
                    {summary.timeline.map((item) => (
                      <div
                        key={`${item.date}-${item.event}`}
                        className="grid gap-2 rounded-xl border border-chambray/10 bg-white/30 p-3 sm:grid-cols-[9rem_1fr] dark:bg-white/5"
                      >
                        <p className="text-xs font-semibold tracking-wide text-sanmarino uppercase">
                          {item.date}
                        </p>
                        <p>{item.event}</p>
                      </div>
                    ))}
                  </div>
                </SummarySection>
              ) : null}

              {summary.decisions.length > 0 ? (
                <SummarySection title="Key decisions">
                  {summary.decisions.map((item) => (
                    <div
                      key={`${item.label}-${item.detail}`}
                      className="rounded-xl border border-chambray/10 bg-white/30 p-3 dark:bg-white/5"
                    >
                      <p className="font-medium text-chambray">{item.label}</p>
                      <p className="mt-1">{item.detail}</p>
                      {item.date ? (
                        <p className="mt-2 text-xs font-medium text-sanmarino">{item.date}</p>
                      ) : null}
                    </div>
                  ))}
                </SummarySection>
              ) : null}

              {summary.actionItems.length > 0 ? (
                <SummarySection title="Action items">
                  {summary.actionItems.map((item) => (
                    <div
                      key={`${item.task}-${item.owner ?? 'any'}`}
                      className="rounded-xl border border-chambray/10 bg-white/30 p-3 dark:bg-white/5"
                    >
                      <p>{item.task}</p>
                      {item.owner ? (
                        <p className="mt-1 text-xs font-medium text-chambray">{item.owner}</p>
                      ) : null}
                      {item.dueHint ? (
                        <p className="mt-1 text-xs text-sanmarino">{item.dueHint}</p>
                      ) : null}
                    </div>
                  ))}
                </SummarySection>
              ) : null}

              {summary.referencedFiles.some((file) => file.isImage) &&
              fetchAttachmentDownloadUrl ? (
                <SummarySection title="Conversation visuals">
                  <div className="space-y-4">
                    {summary.referencedFiles
                      .filter((file) => file.isImage)
                      .map((file) => (
                        <ConversationVisualCard
                          key={file.attachmentId}
                          file={file}
                          fetchDownloadUrl={fetchAttachmentDownloadUrl}
                        />
                      ))}
                  </div>
                </SummarySection>
              ) : null}

              {summary.referencedFiles.some((file) => !file.isImage) &&
              fetchAttachmentDownloadUrl ? (
                <SummarySection title="Other files">
                  <div className="space-y-3">
                    {summary.referencedFiles
                      .filter((file) => !file.isImage)
                      .map((file) => (
                        <OtherFileRow
                          key={file.attachmentId}
                          file={file}
                          fetchDownloadUrl={fetchAttachmentDownloadUrl}
                        />
                      ))}
                  </div>
                </SummarySection>
              ) : null}

              {summary.openQuestions.length > 0 ? (
                <SummarySection title="Open questions">
                  {summary.openQuestions.map((item) => (
                    <p key={item} className="rounded-lg bg-chambray/5 px-3 py-2">
                      {item}
                    </p>
                  ))}
                </SummarySection>
              ) : null}

              <p className="text-xs text-app-muted">
                AI-generated summary — verify critical details in the thread.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-chambray/10 px-5 py-4 sm:px-6">
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={exporting}
                onClick={() => void runExport()}
              >
                {exporting ? 'Preparing PDF — this may take a moment…' : 'Download PDF'}
              </button>
              <button
                type="button"
                className={ghostButtonClassName}
                disabled={loading}
                onClick={() => void runGenerate(true)}
              >
                Regenerate
              </button>
              {error ? (
                <p className="w-full text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4 px-5 py-6 sm:px-6">
            <p className="text-base font-medium text-chambray">Could not generate summary</p>
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
            <button type="button" className={ghostButtonClassName} onClick={close}>
              Close
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
