'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import FilePreviewModal from '@/components/file-preview-modal'
import {
  fetchAttachmentDownloadUrl,
  fetchProjectFiles,
  uploadProjectFiles,
} from '@/lib/projects/fetch-project-files'
import type { ProjectAttachmentWithUsage } from '@/lib/projects/types'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { Download, FileText, Loader2, Upload } from 'lucide-react'

type CollaborateProjectFilesProps = {
  projectId: string
  projectTitle: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function FileRow({
  file,
  onPreview,
}: {
  file: ProjectAttachmentWithUsage
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const isImage = file.mimeType.startsWith('image/')

  useEffect(() => {
    if (!isImage) return
    void fetchAttachmentDownloadUrl(file.id).then(setThumbUrl)
  }, [file.id, isImage])

  const openPreview = async () => {
    const url = thumbUrl ?? (await fetchAttachmentDownloadUrl(file.id))
    onPreview(file, url)
  }

  const onDownload = async (event: React.MouseEvent) => {
    event.stopPropagation()
    const url = thumbUrl ?? (await fetchAttachmentDownloadUrl(file.id))
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  return (
    <li className="flex flex-col gap-3 border-b border-chambray/6 px-4 py-3 last:border-0 sm:grid sm:grid-cols-[1fr_100px_72px] sm:items-center sm:gap-4 sm:px-5 sm:py-4">
      <button
        type="button"
        onClick={() => void openPreview()}
        className="group flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-chambray/6"
        aria-label={`Preview ${file.fileName}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sanmarino/10 text-sanmarino">
          {isImage && thumbUrl ? (
            <img
              src={thumbUrl}
              alt={file.fileName}
              className="h-full w-full object-cover"
            />
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
      <p className="text-xs text-app-muted">{formatRelativeTime(file.createdAt)}</p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-xs text-app-muted">{formatBytes(file.sizeBytes)}</span>
        <button
          type="button"
          onClick={(event) => void onDownload(event)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sanmarino transition hover:bg-chambray/8 hover:text-chambray"
          aria-label={`Download ${file.fileName}`}
        >
          <Download className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  )
}

function FileSection({
  projectId,
  title,
  description,
  files,
  readOnly,
  onRefresh,
  onPreview,
}: {
  projectId: string
  title: string
  description: string
  files: ProjectAttachmentWithUsage[]
  readOnly?: boolean
  onRefresh: () => void
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onUpload = async (fileList: FileList | null) => {
    if (!fileList?.length || readOnly) return
    setUploading(true)
    setError(null)
    const result = await uploadProjectFiles(projectId, Array.from(fileList), {
      visibility: 'INTERNAL',
    })
    if (!result.ok) setError(result.message ?? 'Upload failed')
    else onRefresh()
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="admin-glass-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-chambray/8 px-4 py-4 sm:px-5 dark:border-white/10">
        <div>
          <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>{title}</h3>
          <p className="mt-1 text-sm text-app-muted">{description}</p>
        </div>
        {!readOnly ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => void onUpload(e.target.files)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="admin-btn-ghost inline-flex items-center gap-2 text-sm"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              Upload
            </button>
          </div>
        ) : null}
      </div>
      {error ? <p className="px-4 py-3 text-sm text-red-700 sm:px-5">{error}</p> : null}
      {files.length === 0 ? (
        <p className="px-4 py-6 text-sm text-app-muted sm:px-5">
          {readOnly ? 'No client-visible files yet.' : 'No team files yet. Upload one above.'}
        </p>
      ) : (
        <ul>{files.map((file) => <FileRow key={file.id} file={file} onPreview={onPreview} />)}</ul>
      )}
    </section>
  )
}

export default function CollaborateProjectFiles({
  projectId,
  projectTitle,
}: CollaborateProjectFilesProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalFiles, setInternalFiles] = useState<ProjectAttachmentWithUsage[]>([])
  const [clientFiles, setClientFiles] = useState<ProjectAttachmentWithUsage[]>([])
  const [preview, setPreview] = useState<{
    file: ProjectAttachmentWithUsage
    url: string | null
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [internalLib, clientLib] = await Promise.all([
        fetchProjectFiles(projectId, { visibility: 'INTERNAL' }),
        fetchProjectFiles(projectId, { visibility: 'CLIENT' }),
      ])
      const flatten = (lib: typeof internalLib) => {
        const group = lib?.projects?.[0]
        if (!group) return []
        return [...group.libraryUploads, ...group.usedInThreads]
      }
      setInternalFiles(flatten(internalLib))
      setClientFiles(flatten(clientLib))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load files')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-app-muted">Loading files…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg text-chambray ${bricolage_grot700.className}`}>Project files</h2>
        <p className="mt-1 text-sm text-app-muted">
          Files for {projectTitle}. Use them in team review messages.
        </p>
      </div>

      <FileSection
        projectId={projectId}
        title="Team files"
        description="Internal only. Upload here or attach when messaging in team review."
        files={internalFiles}
        onRefresh={() => void load()}
        onPreview={(file, url) => setPreview({ file, url })}
      />

      <FileSection
        projectId={projectId}
        title="Client-visible files"
        description="Read-only context from the client portal. You cannot upload or share these in team review."
        files={clientFiles}
        readOnly
        onRefresh={() => void load()}
        onPreview={(file, url) => setPreview({ file, url })}
      />

      <FilePreviewModal
        open={Boolean(preview)}
        fileName={preview?.file.fileName ?? ''}
        mimeType={preview?.file.mimeType ?? ''}
        url={preview?.url ?? null}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}
