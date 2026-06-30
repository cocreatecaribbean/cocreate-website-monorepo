'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import FilePreviewModal from '@/components/file-preview-modal'
import type { ClientFilesLibrary, ProjectAttachmentWithUsage } from '@/lib/projects/api-types'
import { useUploadProjectFilesMutation } from '@/lib/api/mutations/files'
import { useFilesLibraryQuery } from '@/lib/api/queries/files'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600 } from '@/styles/fonts'
import { Download, FileText, FolderKanban, Loader2, Search, Upload } from 'lucide-react'

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
  fetchDownloadUrl,
  projectTitle,
}: {
  file: ProjectAttachmentWithUsage
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
  fetchDownloadUrl: (attachmentId: string) => Promise<string | null>
  projectTitle?: string
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const isImage = file.mimeType.startsWith('image/')

  useEffect(() => {
    if (!isImage) return
    void fetchDownloadUrl(file.id).then(setThumbUrl)
  }, [fetchDownloadUrl, file.id, isImage])

  const openPreview = async () => {
    const url = thumbUrl ?? (await fetchDownloadUrl(file.id))
    onPreview(file, url)
  }

  const onDownload = async (event: React.MouseEvent) => {
    event.stopPropagation()
    const url = thumbUrl ?? (await fetchDownloadUrl(file.id))
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.rel = 'noopener noreferrer'
    anchor.click()
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
      {projectTitle ? (
        <p className="truncate text-xs text-app-muted">{projectTitle}</p>
      ) : null}
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

function ProjectFilesBlock({
  group,
  onRefresh,
  onPreview,
}: {
  group: ClientFilesLibrary['projects'][number]
  onRefresh: () => void
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadProjectFilesMutation(group.projectId)
  const [error, setError] = useState<string | null>(null)

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)
    const result = await uploadMutation.mutateAsync({
      files: Array.from(files),
    })
    if (!result.ok) {
      setError(result.message ?? 'Upload failed')
    } else {
      onRefresh()
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const totalCount = group.libraryUploads.length + group.usedInThreads.length
  const uploading = uploadMutation.isPending

  return (
    <section className="portal-glass-card portal-animate-in overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chambray/8 px-5 py-4 dark:border-white/10">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-sanmarino" aria-hidden />
          <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>
            {group.projectTitle}
          </h3>
          <span className="text-xs text-app-muted">
            {totalCount} file{totalCount === 1 ? '' : 's'}
          </span>
        </div>
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
            className="portal-btn-ghost inline-flex items-center gap-2 text-sm"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            Add files
          </button>
        </div>
      </div>

      {error ? (
        <p className="portal-alert-error mx-5 my-3">{error}</p>
      ) : null}

      {totalCount === 0 ? (
        <p className="px-5 py-8 text-sm text-app-muted">No files for this project yet.</p>
      ) : (
        <div className="divide-y divide-chambray/6">
          <div>
            <p className="px-5 py-3 text-xs font-medium tracking-wide text-app-muted uppercase">
              Library uploads
            </p>
            {group.libraryUploads.length === 0 ? (
              <p className="px-5 pb-4 text-sm text-app-muted">No library-only files.</p>
            ) : (
              <ul>
                {group.libraryUploads.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    fetchDownloadUrl={fetchAttachmentDownloadUrl}
                    onPreview={onPreview}
                  />
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="px-5 py-3 text-xs font-medium tracking-wide text-app-muted uppercase">
              Used in message threads
            </p>
            {group.usedInThreads.length === 0 ? (
              <p className="px-5 pb-4 text-sm text-app-muted">No files shared in threads yet.</p>
            ) : (
              <ul>
                {group.usedInThreads.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    fetchDownloadUrl={fetchAttachmentDownloadUrl}
                    onPreview={onPreview}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default function ControlCenterFilesSection() {
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('')
  const [preview, setPreview] = useState<{
    file: ProjectAttachmentWithUsage
    url: string | null
  } | null>(null)
  const search = query.trim()

  const {
    data: library = { projects: [], files: [], nextCursor: null },
    isLoading: loading,
    isError,
    refetch,
  } = useFilesLibraryQuery({
    projectId: projectId || undefined,
    q: search || undefined,
  })

  if (loading) {
    return (
      <div className="portal-glass-card flex items-center justify-center gap-2 p-12 text-sm text-app-muted">
        <Loader2 className="h-5 w-5 animate-spin text-sanmarino" aria-hidden />
        Loading files…
      </div>
    )
  }

  if (isError) {
    return (
      <p className="portal-glass-card portal-alert-error p-5 sm:p-6">Could not load files</p>
    )
  }

  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-animate-in p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-xs font-medium text-app-muted">Search files</span>
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-app-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by filename"
                className="portal-input w-full pl-9"
              />
            </div>
          </label>
          <label className="sm:w-56">
            <span className="text-xs font-medium text-app-muted">Project</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="portal-input mt-1 w-full"
            >
              <option value="">All projects</option>
              {library.projects.map((group) => (
                <option key={group.projectId} value={group.projectId}>
                  {group.projectTitle}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {library.projects.length === 0 ? (
        <p className="portal-glass-card p-8 text-center text-sm text-app-muted">
          No files found.
        </p>
      ) : (
        library.projects.map((group) => (
          <ProjectFilesBlock
            key={group.projectId}
            group={group}
            onRefresh={() => void refetch()}
            onPreview={(file, url) => setPreview({ file, url })}
          />
        ))
      )}

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
