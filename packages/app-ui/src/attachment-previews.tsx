'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type PreviewAttachment = {
  id: string
  fileName: string
  mimeType: string
  createdAt?: string
  uploadedByUserId?: string
}

export type FetchAttachmentDownloadUrl = (
  attachmentId: string,
) => Promise<string | null>

export type RenderAttachmentAction = (
  attachment: PreviewAttachment,
) => ReactNode

export type RenderAttachmentBadge = (
  attachment: PreviewAttachment,
) => ReactNode

/** Read-only emoji cluster for aggregate file reactions. */
export function AttachmentReactionCluster({
  emojis,
  className = '',
}: {
  emojis: string[]
  className?: string
}) {
  const shown = emojis.slice(0, 3)
  if (!shown.length) return null
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full border border-chambray/15 bg-white/95 px-1.5 py-0.5 text-[11px] leading-none shadow-sm dark:border-white/10 dark:bg-slate-900/95 ${className}`.trim()}
      aria-label={`Reactions: ${shown.join(' ')}`}
    >
      {shown.map((emoji, index) => (
        <span key={`${emoji}-${index}`} aria-hidden>
          {emoji}
        </span>
      ))}
    </span>
  )
}

type AttachmentPreviewsProps = {
  attachments?: PreviewAttachment[]
  fetchDownloadUrl: FetchAttachmentDownloadUrl
  variant?: 'portal' | 'admin'
  showHeading?: boolean
  compact?: boolean
  className?: string
  onDeleteAttachment?: (attachmentId: string) => void | Promise<void>
  canDeleteAttachment?: (attachmentId: string) => boolean
  deletingAttachmentId?: string | null
  renderAttachmentAction?: RenderAttachmentAction
  /** Top-right overlay on the card (e.g. aggregate reaction emojis). */
  renderAttachmentBadge?: RenderAttachmentBadge
}

type MediaPreviewOverlayProps = {
  open: boolean
  kind: 'image' | 'video'
  url: string
  fileName: string
  onClose: () => void
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}

function MediaPreviewOverlay({
  open,
  kind,
  url,
  fileName,
  onClose,
}: MediaPreviewOverlayProps) {
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

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-chambray/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={fileName}
        className="relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg leading-none text-chambray shadow-md hover:bg-white/95 sm:-right-3 sm:-top-3"
          aria-label="Close"
        >
          ×
        </button>
        {kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={fileName}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
          />
        )}
        <p className="max-w-full truncate text-center text-sm text-white/90">{fileName}</p>
      </div>
    </div>,
    document.body,
  )
}

function PreviewItem({
  attachment,
  fetchDownloadUrl,
  variant,
  compact = false,
  onDeleteAttachment,
  canDelete = false,
  deleting = false,
  action,
  badge,
}: {
  attachment: PreviewAttachment
  fetchDownloadUrl: FetchAttachmentDownloadUrl
  variant: 'portal' | 'admin'
  compact?: boolean
  onDeleteAttachment?: (attachmentId: string) => void | Promise<void>
  canDelete?: boolean
  deleting?: boolean
  action?: ReactNode
  badge?: ReactNode
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const fetchDownloadUrlRef = useRef(fetchDownloadUrl)
  fetchDownloadUrlRef.current = fetchDownloadUrl
  const isImage = attachment.mimeType.startsWith('image/')
  const isVideo = attachment.mimeType.startsWith('video/')
  const previewable = isImage || isVideo
  const showFooter = canDelete && Boolean(onDeleteAttachment)

  useEffect(() => {
    if (!previewable) return
    let cancelled = false
    void fetchDownloadUrlRef.current(attachment.id).then((nextUrl) => {
      if (!cancelled) setUrl(nextUrl)
    })
    return () => {
      cancelled = true
    }
  }, [attachment.id, previewable])

  const openFile = async () => {
    const downloadUrl = url ?? (await fetchDownloadUrl(attachment.id))
    if (!downloadUrl) return

    if (isImage) {
      setUrl(downloadUrl)
      setLightboxOpen(true)
      return
    }

    if (isVideo) {
      setUrl(downloadUrl)
      setVideoModalOpen(true)
      return
    }

    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }

  const cardClass =
    variant === 'admin'
      ? 'rounded-xl border border-chambray/10 bg-white/40 dark:border-white/10 dark:bg-white/5'
      : 'rounded-xl border border-chambray/10 bg-white/30 dark:border-white/10 dark:bg-white/5'
  const mediaClass = compact
    ? 'max-h-32 w-full rounded-lg object-contain'
    : 'max-h-64 w-full rounded-lg object-contain'

  return (
    <>
      <div className="relative pr-3">
        <div className={`relative ${cardClass} overflow-hidden`}>
          {badge ? (
            <div className="pointer-events-none absolute top-2 right-2 z-10">
              {badge}
            </div>
          ) : null}
          <div className="p-3">
            {isImage && url ? (
              <button
                type="button"
                onClick={() => void openFile()}
                className="block w-full cursor-zoom-in text-left"
                aria-label={`View ${attachment.fileName} full size`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={attachment.fileName} className={mediaClass} />
              </button>
            ) : isVideo && url ? (
              <button
                type="button"
                onClick={() => void openFile()}
                className="block w-full cursor-pointer text-left"
                aria-label={`Play ${attachment.fileName} full size`}
              >
                <video src={url} controls className={mediaClass} preload="metadata" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void openFile()}
                className="flex w-full items-center gap-2 text-left text-sm text-sanmarino hover:text-chambray dark:hover:text-casablanca"
              >
                <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
                <span aria-hidden>↗</span>
              </button>
            )}
          </div>

          {showFooter ? (
            <div className="flex items-center justify-between gap-2 border-t border-chambray/10 px-3 py-2 dark:border-white/10">
              <p className="min-w-0 truncate text-[0.7rem] text-app-muted">
                {attachment.fileName}
              </p>
              <button
                type="button"
                disabled={deleting}
                onClick={(event) => {
                  event.stopPropagation()
                  void onDeleteAttachment?.(attachment.id)
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
                aria-label={`Remove ${attachment.fileName}`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ) : null}
        </div>

        {action ? (
          <div className="absolute top-1/2 -right-1 z-10 -translate-y-1/2 translate-x-1/2">
            {action}
          </div>
        ) : null}
      </div>

      {lightboxOpen && url ? (
        <MediaPreviewOverlay
          open={lightboxOpen}
          kind="image"
          url={url}
          fileName={attachment.fileName}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}

      {videoModalOpen && url ? (
        <MediaPreviewOverlay
          open={videoModalOpen}
          kind="video"
          url={url}
          fileName={attachment.fileName}
          onClose={() => setVideoModalOpen(false)}
        />
      ) : null}
    </>
  )
}

export function AttachmentPreviews({
  attachments,
  fetchDownloadUrl,
  variant = 'portal',
  showHeading = true,
  compact = false,
  className = '',
  onDeleteAttachment,
  canDeleteAttachment,
  deletingAttachmentId = null,
  renderAttachmentAction,
  renderAttachmentBadge,
}: AttachmentPreviewsProps) {
  if (!attachments?.length) return null

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {showHeading ? (
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-app-muted">
          Files to review
        </p>
      ) : null}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        {attachments.map((attachment) => (
          <PreviewItem
            key={attachment.id}
            attachment={attachment}
            fetchDownloadUrl={fetchDownloadUrl}
            variant={variant}
            compact={compact}
            onDeleteAttachment={onDeleteAttachment}
            canDelete={canDeleteAttachment?.(attachment.id) ?? Boolean(onDeleteAttachment)}
            deleting={deletingAttachmentId === attachment.id}
            action={renderAttachmentAction?.(attachment)}
            badge={renderAttachmentBadge?.(attachment)}
          />
        ))}
      </div>
    </div>
  )
}
