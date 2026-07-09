'use client'

import type { ProjectAttachmentWithUsage } from '@/lib/projects/api-types'
import { useAttachmentDownloadUrl } from '@/lib/api/queries/projects'
import { bricolage_grot600 } from '@/styles/fonts'
import { Download, FileText, Play, Trash2 } from 'lucide-react'

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
}

export default function PortalFileRow({
  file,
  onPreview,
  projectTitle,
  onDelete,
  deleting = false,
  canDelete = false,
}: PortalFileRowProps) {
  const isImage = file.mimeType.startsWith('image/')
  const isVideo = file.mimeType.startsWith('video/')
  const { data: downloadResult } = useAttachmentDownloadUrl(file.id)
  const downloadUrl = downloadResult?.url ?? null

  const openPreview = () => {
    onPreview(file, downloadUrl)
  }

  const onDownload = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!downloadUrl) return
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
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
    <li
      className={`flex flex-col gap-3 border-b border-chambray/6 px-5 py-4 last:border-0 sm:grid sm:items-center sm:gap-4 ${
        projectTitle
          ? 'sm:grid-cols-[1fr_180px_100px_80px]'
          : 'sm:grid-cols-[1fr_100px_80px]'
      }`}
    >
      <button
        type="button"
        onClick={() => void openPreview()}
        className="group flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-chambray/6"
        aria-label={`Preview ${file.fileName}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sanmarino/10 text-sanmarino">
          {isImage && downloadUrl ? (
            <img
              src={downloadUrl}
              alt={file.fileName}
              className="h-full w-full object-cover"
            />
          ) : isVideo ? (
            <Play className="h-5 w-5" aria-hidden />
          ) : (
            <FileText className="h-5 w-5" aria-hidden />
          )}
        </div>
        <p
          className={`truncate text-sm text-chambray underline-offset-4 transition group-hover:underline ${bricolage_grot600.className}`}
        >
          {file.fileName}
        </p>
      </button>
      {projectTitle ? (
        <p className="truncate text-xs text-app-muted">{projectTitle}</p>
      ) : null}
      <p className="text-xs text-app-muted">{formatFileRelativeTime(file.createdAt)}</p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-xs text-app-muted">{formatFileBytes(file.sizeBytes)}</span>
        <div className="flex items-center gap-1">
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
