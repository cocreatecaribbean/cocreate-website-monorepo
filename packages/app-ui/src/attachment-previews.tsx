'use client'

import { useEffect, useState } from 'react'
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
}

type MediaPreviewOverlayProps = {
  open: boolean
  kind: 'image' | 'video'
  url: string
  fileName: string
  onClose: () => void
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
}: {
  attachment: PreviewAttachment
  fetchDownloadUrl: FetchAttachmentDownloadUrl
  variant: 'portal' | 'admin'
  compact?: boolean
  onDeleteAttachment?: (attachmentId: string) => void | Promise<void>
  canDelete?: boolean
  deleting?: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const isImage = attachment.mimeType.startsWith('image/')
  const isVideo = attachment.mimeType.startsWith('video/')
  const previewable = isImage || isVideo

  useEffect(() => {
    if (!previewable) return
    void fetchDownloadUrl(attachment.id).then(setUrl)
  }, [attachment.id, fetchDownloadUrl, previewable])

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
      ? 'rounded-xl border border-chambray/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5'
      : 'rounded-xl border border-chambray/10 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5'
  const mediaClass = compact
    ? 'max-h-32 w-full rounded-lg object-contain'
    : 'max-h-64 w-full rounded-lg object-contain'

  return (
    <>
      <div className={`${cardClass} relative`}>
        {canDelete && onDeleteAttachment ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => void onDeleteAttachment(attachment.id)}
            className={`absolute right-2 top-2 rounded-md px-2 py-1 text-[0.65rem] font-medium ${
              variant === 'admin'
                ? 'bg-white/90 text-red-700 hover:bg-white dark:bg-chambray/90 dark:text-red-300'
                : 'bg-white/90 text-red-700 hover:bg-white dark:bg-chambray/90 dark:text-red-300'
            } disabled:opacity-50`}
            aria-label={`Remove ${attachment.fileName}`}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        ) : null}
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
}: AttachmentPreviewsProps) {
  if (!attachments?.length) return null

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {showHeading ? (
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-app-muted">
          Files to review
        </p>
      ) : null}
      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
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
          />
        ))}
      </div>
    </div>
  )
}
