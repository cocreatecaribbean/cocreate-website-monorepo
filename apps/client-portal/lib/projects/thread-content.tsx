'use client'

import type { ReactNode } from 'react'
import {
  AttachmentPreviews,
  type PreviewAttachment,
  type RenderAttachmentBadge,
} from '@cocreate/app-ui/attachment-previews'
import { indexAttachmentsByMessage as indexAttachmentsByMessageBase } from '@cocreate/app-ui/thread-message-merge'
import type { AttachmentDownloadUrlResult } from '@/lib/projects/fetch-projects-client'

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi

export type ThreadAttachment = {
  id: string
  fileName: string
  mimeType: string
  createdAt?: string
  uploadedByUserId?: string
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
  fetchDownloadUrl: (attachmentId: string) => Promise<AttachmentDownloadUrlResult>
  variant?: 'portal' | 'admin'
  showHeading?: boolean
  compact?: boolean
  className?: string
  onDeleteAttachment?: (attachmentId: string) => void | Promise<void>
  canDeleteAttachment?: (attachmentId: string) => boolean
  deletingAttachmentId?: string | null
  renderAttachmentAction?: (attachment: PreviewAttachment) => ReactNode
  renderAttachmentBadge?: RenderAttachmentBadge
}

type MessageWithAttachments = {
  id: string
  createdAt: string
  attachments?: ThreadAttachment[]
}

export function indexAttachmentsByMessage(
  messages: MessageWithAttachments[],
  attachments?: ThreadAttachment[],
): Map<number, ThreadAttachment[]> {
  return indexAttachmentsByMessageBase(messages, attachments)
}

export function RequestAttachments({
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
}: RequestAttachmentsProps) {
  return (
    <AttachmentPreviews
      attachments={attachments}
      fetchDownloadUrl={async (attachmentId) => {
        const result = await fetchDownloadUrl(attachmentId)
        return result.url
      }}
      variant={variant}
      showHeading={showHeading}
      compact={compact}
      className={className}
      onDeleteAttachment={onDeleteAttachment}
      canDeleteAttachment={canDeleteAttachment}
      deletingAttachmentId={deletingAttachmentId}
      renderAttachmentAction={renderAttachmentAction}
      renderAttachmentBadge={renderAttachmentBadge}
    />
  )
}
