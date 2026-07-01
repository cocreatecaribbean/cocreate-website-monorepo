'use client'

// AttachmentItem uses useAttachmentDownloadUrl (React Query), not useEffect.
import { useState } from 'react'
import { ExternalLink, FileText, Play } from 'lucide-react'
import FilePreviewModal from '@/components/file-preview-modal'
import ImageLightbox from '@/components/image-lightbox'
import { useAttachmentDownloadUrl } from '@/lib/api/queries/projects'
import { useInView } from '@/lib/hooks/use-in-view'

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi

export type ThreadAttachment = {
  id: string
  fileName: string
  mimeType: string
  createdAt?: string
}

type LinkifiedBodyProps = {
  body: string
  linkClassName?: string
}

export function splitTextWithLinks(text: string): Array<{ type: 'text' | 'link'; value: string }> {
  const parts: Array<{ type: 'text' | 'link'; value: string }> = []
  let lastIndex = 0
  const matches = text.matchAll(URL_PATTERN)

  for (const match of matches) {
    const url = match[0]
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) })
    }
    parts.push({ type: 'link', value: url.replace(/[.,;:!?)]+$/, '') })
    lastIndex = index + url.length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return parts.length ? parts : [{ type: 'text', value: text }]
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

function vimeoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

export function LinkifiedBody({ body, linkClassName = 'text-sanmarino underline underline-offset-2' }: LinkifiedBodyProps) {
  const parts = splitTextWithLinks(body)
  const embedUrl =
    parts.find((p) => p.type === 'link' && (youtubeEmbedUrl(p.value) || vimeoEmbedUrl(p.value)))
      ?.value ?? null
  const iframeSrc = embedUrl ? (youtubeEmbedUrl(embedUrl) ?? vimeoEmbedUrl(embedUrl)) : null

  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap [font-family:var(--font-brico-600),system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji']">
        {parts.map((part, i) =>
          part.type === 'link' ? (
            <a
              key={`${part.value}-${i}`}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {part.value}
            </a>
          ) : (
            <span key={`text-${i}`}>{part.value}</span>
          ),
        )}
      </p>
      {iframeSrc ? (
        <div className="overflow-hidden rounded-xl border border-chambray/10 bg-black/5 dark:border-white/10">
          <iframe
            src={iframeSrc}
            title="Review video"
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
    </div>
  )
}

type RequestAttachmentsProps = {
  attachments?: ThreadAttachment[]
  fetchDownloadUrl: (attachmentId: string) => Promise<string | null>
  variant?: 'portal' | 'admin'
  showHeading?: boolean
  compact?: boolean
  className?: string
}

type MessageWithAttachments = {
  createdAt: string
  attachments?: ThreadAttachment[]
}

/** Prefer explicit message attachment links; fall back to legacy request-level bucketing. */
export function indexAttachmentsByMessage(
  messages: MessageWithAttachments[],
  attachments?: ThreadAttachment[],
): Map<number, ThreadAttachment[]> {
  const map = new Map<number, ThreadAttachment[]>()
  if (messages.length === 0) return map

  messages.forEach((message, index) => {
    if (message.attachments?.length) {
      map.set(index, message.attachments)
    }
  })

  if (!attachments?.length) return map

  const linkedIds = new Set(
    [...map.values()].flat().map((attachment) => attachment.id),
  )
  const unlinked = attachments.filter((attachment) => !linkedIds.has(attachment.id))
  if (!unlinked.length) return map

  for (const attachment of unlinked) {
    const at = attachment.createdAt
      ? new Date(attachment.createdAt).getTime()
      : new Date(messages[messages.length - 1]!.createdAt).getTime()

    let index = messages.findIndex((msg, i) => {
      const start = new Date(msg.createdAt).getTime()
      const end = messages[i + 1]
        ? new Date(messages[i + 1]!.createdAt).getTime()
        : Number.POSITIVE_INFINITY
      return at >= start && at < end
    })

    if (index < 0) {
      index = messages.length - 1
    }

    const bucket = map.get(index) ?? []
    bucket.push(attachment)
    map.set(index, bucket)
  }

  return map
}

function AttachmentItem({
  attachment,
  fetchDownloadUrl,
  variant,
  compact = false,
}: {
  attachment: ThreadAttachment
  fetchDownloadUrl: (attachmentId: string) => Promise<string | null>
  variant: 'portal' | 'admin'
  compact?: boolean
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [manualUrl, setManualUrl] = useState<string | null>(null)
  const { ref, inView } = useInView()
  const isImage = attachment.mimeType.startsWith('image/')
  const isVideo = attachment.mimeType.startsWith('video/')
  const previewable = isImage || isVideo

  const { data: fetchedUrl, isFetched, isError } = useAttachmentDownloadUrl(
    previewable ? attachment.id : null,
    { enabled: inView && previewable },
  )
  const url = manualUrl ?? fetchedUrl ?? null
  const previewUnavailable = previewable && isFetched && !url

  const resolveUrl = async () => {
    if (url) return url
    const downloadUrl = await fetchDownloadUrl(attachment.id)
    if (downloadUrl) setManualUrl(downloadUrl)
    return downloadUrl
  }

  const openFile = async () => {
    const downloadUrl = await resolveUrl()
    if (!downloadUrl) return

    if (isImage) {
      setLightboxOpen(true)
      return
    }

    if (isVideo) {
      setPreviewOpen(true)
      return
    }

    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }

  const cardClass =
    'rounded-xl border border-chambray/10 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5'
  const mediaClass = compact ? 'max-h-32 w-full rounded-lg object-contain' : 'max-h-64 w-full rounded-lg object-contain'

  return (
    <div ref={ref} className={cardClass}>
      {isImage && url ? (
        <>
          <button
            type="button"
            onClick={() => void openFile()}
            className="block w-full cursor-zoom-in text-left"
            aria-label={`View ${attachment.fileName} full size`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={attachment.fileName}
              className={mediaClass}
            />
          </button>
          <ImageLightbox
            open={lightboxOpen}
            src={url}
            alt={attachment.fileName}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      ) : isVideo && url ? (
        <>
          <video
            src={url}
            controls
            className={mediaClass}
            preload="metadata"
          />
          {!compact ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="mt-2 flex w-full items-center gap-2 text-left text-xs text-sanmarino hover:text-chambray dark:hover:text-casablanca"
            >
              <Play className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Preview video
            </button>
          ) : null}
          <FilePreviewModal
            open={previewOpen}
            fileName={attachment.fileName}
            mimeType={attachment.mimeType}
            url={url}
            onClose={() => setPreviewOpen(false)}
          />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void openFile()}
            disabled={previewable && inView && !isFetched && !isError}
            className="flex w-full items-center gap-2 text-left text-sm text-sanmarino hover:text-chambray disabled:opacity-60 dark:hover:text-casablanca"
          >
            {isVideo ? (
              <Play className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </button>
          {previewUnavailable ? (
            <p className="mt-1 text-xs text-app-muted">
              Preview unavailable — try Open when the connection is restored.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

export function RequestAttachments({
  attachments,
  fetchDownloadUrl,
  variant = 'portal',
  showHeading = true,
  compact = false,
  className = '',
}: RequestAttachmentsProps) {
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
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            fetchDownloadUrl={fetchDownloadUrl}
            variant={variant}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}
