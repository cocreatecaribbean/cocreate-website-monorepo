'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  FileAudio,
  FileText,
  FileType2,
  ImageIcon,
  Play,
  X,
} from 'lucide-react'

export type FileMediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'other'

export function resolveFileMediaKind(mimeType: string, fileName?: string): FileMediaKind {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) {
    return 'pdf'
  }
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('xml')
  ) {
    return 'text'
  }
  return 'other'
}

export type FileMediaTileProps = {
  fileName: string
  mimeType: string
  /** Local object URL or remote signed URL. When omitted for remote files, pass fetchUrl. */
  src?: string | null
  /** Lazily fetch a remote signed URL when the tile enters the viewport. */
  fetchUrl?: () => Promise<string | null>
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  /** Accessible label override for the clickable tile. */
  ariaLabel?: string
}

const SIZE_CLASS = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-14 w-14 rounded-xl',
  lg: 'h-40 w-full rounded-2xl',
} as const

const ICON_SIZE = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

function FallbackIcon({
  kind,
  className,
}: {
  kind: FileMediaKind
  className: string
}) {
  if (kind === 'image') return <ImageIcon className={className} aria-hidden />
  if (kind === 'video') return <Play className={className} aria-hidden />
  if (kind === 'audio') return <FileAudio className={className} aria-hidden />
  if (kind === 'pdf') return <FileType2 className={className} aria-hidden />
  return <FileText className={className} aria-hidden />
}

function useLazyRemoteUrl(
  fetchUrl: (() => Promise<string | null>) | undefined,
  enabled: boolean,
) {
  const [url, setUrl] = useState<string | null>(null)
  const [visible, setVisible] = useState(!fetchUrl)
  const rootRef = useRef<HTMLDivElement>(null)
  const fetchUrlRef = useRef(fetchUrl)
  fetchUrlRef.current = fetchUrl

  useEffect(() => {
    if (!fetchUrl || !enabled) return
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchUrl, enabled])

  useEffect(() => {
    if (!visible || !fetchUrlRef.current || !enabled) return
    let cancelled = false
    void fetchUrlRef.current().then((next) => {
      if (!cancelled) setUrl(next)
    })
    return () => {
      cancelled = true
    }
  }, [visible, enabled])

  return { rootRef, url }
}

export function FileMediaTile({
  fileName,
  mimeType,
  src = null,
  fetchUrl,
  size = 'md',
  className = '',
  onClick,
  ariaLabel,
}: FileMediaTileProps) {
  const kind = resolveFileMediaKind(mimeType, fileName)
  const canPreview = kind === 'image' || kind === 'video'
  const { rootRef, url: lazyUrl } = useLazyRemoteUrl(fetchUrl, canPreview && !src)
  const mediaUrl = src ?? lazyUrl
  const [mediaFailed, setMediaFailed] = useState(false)

  useEffect(() => {
    setMediaFailed(false)
  }, [mediaUrl])

  const shellClass = `${SIZE_CLASS[size]} relative flex shrink-0 items-center justify-center overflow-hidden bg-sanmarino/10 text-sanmarino ${className}`.trim()
  const iconClass = ICON_SIZE[size]
  const showImage = kind === 'image' && mediaUrl && !mediaFailed
  const showVideo = kind === 'video' && mediaUrl && !mediaFailed

  const content: ReactNode = showImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setMediaFailed(true)}
    />
  ) : showVideo ? (
    <>
      <video
        src={mediaUrl}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onError={() => setMediaFailed(true)}
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sanmarino shadow">
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
        </span>
      </span>
    </>
  ) : (
    <FallbackIcon kind={kind} className={iconClass} />
  )

  if (onClick) {
    return (
      <button
        type="button"
        ref={rootRef as never}
        onClick={onClick}
        className={`${shellClass} transition hover:ring-2 hover:ring-sanmarino/30`}
        aria-label={ariaLabel ?? `Preview ${fileName}`}
      >
        {content}
      </button>
    )
  }

  return (
    <div ref={rootRef} className={shellClass} aria-hidden>
      {content}
    </div>
  )
}

/** Create and manage a local object URL for a File/Blob. */
export function useObjectUrl(file: Blob | File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])

  return url
}

export type AttachmentPreviewChipProps = {
  fileName: string
  mimeType: string
  /** Local File for pending uploads. */
  localFile?: File | null
  /** Remote signed-URL loader for library picks. */
  fetchUrl?: () => Promise<string | null>
  onRemove: () => void
}

/** Compact selected/pending attachment chip with thumbnail + remove control. */
export function AttachmentPreviewChip({
  fileName,
  mimeType,
  localFile = null,
  fetchUrl,
  onRemove,
}: AttachmentPreviewChipProps) {
  const localUrl = useObjectUrl(localFile)

  return (
    <li className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-chambray/10 bg-chambray/[0.03] py-1 pr-1.5 pl-1 text-xs text-chambray">
      <FileMediaTile
        fileName={fileName}
        mimeType={mimeType}
        size="sm"
        src={localUrl}
        fetchUrl={localUrl ? undefined : fetchUrl}
        className="h-8 w-8 rounded-xl"
      />
      <span className="min-w-0 max-w-[10rem] truncate sm:max-w-[14rem]">{fileName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1 hover:bg-chambray/10"
        aria-label={`Remove ${fileName}`}
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </li>
  )
}
