'use client'

import { useCallback, useId, useRef, useState } from 'react'

export type ThreadTranscriptExportOptions = {
  from?: string
  to?: string
}

export type ThreadTranscriptExportProps = {
  onExportPdf: (options?: ThreadTranscriptExportOptions) => Promise<void>
  triggerClassName?: string
  panelClassName?: string
  primaryButtonClassName?: string
  ghostButtonClassName?: string
  disabled?: boolean
}

export default function ThreadTranscriptExport({
  onExportPdf,
  triggerClassName = 'portal-btn-ghost shrink-0 px-3 py-1.5 text-xs',
  panelClassName = 'portal-glass-card',
  primaryButtonClassName = 'portal-btn-primary px-4 py-2 text-sm',
  ghostButtonClassName = 'portal-btn-ghost px-4 py-2 text-sm',
  disabled = false,
}: ThreadTranscriptExportProps) {
  const dialogId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    dialogRef.current?.close()
  }, [])

  const openDialog = useCallback(() => {
    setError(null)
    setOpen(true)
    dialogRef.current?.showModal()
  }, [])

  const runExport = useCallback(async () => {
    setExporting(true)
    setError(null)
    try {
      await onExportPdf({
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      })
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download transcript.')
    } finally {
      setExporting(false)
    }
  }, [close, from, onExportPdf, to])

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        disabled={disabled || exporting}
        onClick={openDialog}
      >
        Transcript
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        className={`${panelClassName} fixed top-1/2 left-1/2 z-50 m-0 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden border-0 p-0 backdrop:bg-chambray/40`}
        onClose={() => setOpen(false)}
      >
        {open ? (
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-chambray">Download transcript</p>
                <p className="mt-1 text-sm text-app-muted">
                  Full message history as PDF. Leave dates empty for the entire thread.
                  Dates use your local timezone.
                </p>
              </div>
              <button
                type="button"
                className={ghostButtonClassName}
                onClick={close}
                aria-label="Close transcript export"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-chambray">
                <span className="text-xs font-medium tracking-wide text-app-muted uppercase">
                  From
                </span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="w-full rounded-xl border border-chambray/15 bg-white/70 px-3 py-2 text-sm text-chambray outline-none focus:border-sanmarino dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="space-y-1 text-sm text-chambray">
                <span className="text-xs font-medium tracking-wide text-app-muted uppercase">
                  To
                </span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="w-full rounded-xl border border-chambray/15 bg-white/70 px-3 py-2 text-sm text-chambray outline-none focus:border-sanmarino dark:bg-white/5 dark:text-white"
                />
              </label>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={exporting}
                onClick={() => void runExport()}
              >
                {exporting ? 'Preparing PDF…' : 'Download PDF'}
              </button>
              <button
                type="button"
                className={ghostButtonClassName}
                disabled={exporting}
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
              >
                Clear dates
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
