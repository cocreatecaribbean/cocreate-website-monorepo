'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, ExternalLink, X } from 'lucide-react'

type FilePreviewModalProps = {
  open: boolean
  fileName: string
  mimeType: string
  url: string | null
  onClose: () => void
}

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener noreferrer'
  anchor.click()
}

export default function FilePreviewModal({
  open,
  fileName,
  mimeType,
  url,
  onClose,
}: FilePreviewModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const kind = useMemo(() => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (
      mimeType.startsWith('text/') ||
      mimeType.includes('json') ||
      mimeType.includes('xml')
    ) {
      return 'text'
    }
    return 'other'
  }, [mimeType])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close file preview"
        className="absolute inset-0 bg-chambray/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${fileName}`}
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-[#141a32]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-chambray/10 px-4 py-3 dark:border-white/10">
          <p className="truncate text-sm font-medium text-app-primary">{fileName}</p>
          <div className="flex items-center gap-2">
            {url ? (
              <>
                <button
                  type="button"
                  className="admin-btn-ghost px-3 py-1.5 text-xs"
                  onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open
                </button>
                <button
                  type="button"
                  className="admin-btn-ghost px-3 py-1.5 text-xs"
                  onClick={() => triggerDownload(url, fileName)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-chambray transition hover:bg-chambray/10 dark:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex min-h-[320px] items-center justify-center bg-black/5 p-4 dark:bg-black/20">
          {!url ? (
            <p className="text-sm text-app-muted">Preparing preview…</p>
          ) : kind === 'image' ? (
            <img
              src={url}
              alt={fileName}
              className="max-h-[70vh] max-w-full rounded-lg object-contain"
            />
          ) : kind === 'pdf' || kind === 'text' ? (
            <iframe
              src={url}
              title={fileName}
              className="h-[70vh] w-full rounded-lg border border-chambray/10"
            />
          ) : kind === 'video' ? (
            <video src={url} controls className="max-h-[70vh] w-full rounded-lg" />
          ) : kind === 'audio' ? (
            <audio src={url} controls className="w-full max-w-xl" />
          ) : (
            <div className="text-center">
              <p className="text-sm text-app-muted">
                This file type cannot be previewed inline.
              </p>
              <p className="mt-1 text-xs text-app-muted">
                Use Open or Download above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
