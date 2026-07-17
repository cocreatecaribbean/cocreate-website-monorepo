'use client'

import type {
  ProjectAttachmentWithReactions,
  ProjectAttachmentWithUsage,
  ProjectFileReactionKind,
} from '@/lib/projects/api-types'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import FileReactionMenu from '@/components/control-center/file-reaction-menu'
import { FileMediaTile } from '@cocreate/app-ui/file-media-tile'
import { bricolage_grot600 } from '@/styles/fonts'
import { Download, Trash2 } from 'lucide-react'

export function formatFileBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatFileRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

type PortalFileRowProps = {
  file: ProjectAttachmentWithUsage
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
  projectTitle?: string
  onDelete?: (file: ProjectAttachmentWithUsage) => Promise<void>
  deleting?: boolean
  canDelete?: boolean
  showReaction?: boolean
  initialReaction?: ProjectFileReactionKind | null
  onReactionChange?: (result: ProjectAttachmentWithReactions) => void
}

export default function PortalFileRow({
  file,
  onPreview,
  projectTitle,
  onDelete,
  deleting = false,
  canDelete = false,
  showReaction = false,
  initialReaction = null,
  onReactionChange,
}: PortalFileRowProps) {
  const resolveUrl = async () => {
    const result = await fetchAttachmentDownloadUrl(file.id)
    return result.url
  }

  const openPreview = async () => {
    const url = await resolveUrl()
    onPreview(file, url)
  }

  const onDownload = async (event: React.MouseEvent) => {
    event.stopPropagation()
    const url = await resolveUrl()
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  const onDeleteClick = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!onDelete) return
    const confirmMessage = file.usedInThreads
      ? `Remove "${file.fileName}" from your files and all conversations?`
      : `Remove "${file.fileName}" from your project files?`
    if (!window.confirm(confirmMessage)) return
    await onDelete(file)
  }

  return (
    <li className="flex flex-col gap-3 border-b border-chambray/6 px-5 py-4 last:border-0 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        <FileMediaTile
          fileName={file.fileName}
          mimeType={file.mimeType}
          size="sm"
          fetchUrl={resolveUrl}
          onClick={() => void openPreview()}
        />
        <button
          type="button"
          onClick={() => void openPreview()}
          className="group min-w-0 text-left"
        >
          <p
            className={`truncate text-sm text-chambray underline-offset-4 transition group-hover:underline ${bricolage_grot600.className}`}
          >
            {file.fileName}
          </p>
          {projectTitle ? (
            <p className="mt-0.5 truncate text-xs text-app-muted">{projectTitle}</p>
          ) : null}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
        <p className="whitespace-nowrap text-xs text-app-muted">
          {formatFileRelativeTime(file.createdAt)}
        </p>
        <span className="whitespace-nowrap text-xs text-app-muted">
          {formatFileBytes(file.sizeBytes)}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {showReaction ? (
            <FileReactionMenu
              attachmentId={file.id}
              initialReaction={initialReaction}
              onChange={onReactionChange}
            />
          ) : null}
          <button
            type="button"
            onClick={(event) => void onDownload(event)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sanmarino transition hover:bg-chambray/8 hover:text-chambray"
            aria-label={`Download ${file.fileName}`}
          >
            <Download className="h-4 w-4" aria-hidden />
          </button>
          {canDelete && onDelete ? (
            <button
              type="button"
              disabled={deleting}
              onClick={(event) => void onDeleteClick(event)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
              aria-label={`Remove ${file.fileName}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
