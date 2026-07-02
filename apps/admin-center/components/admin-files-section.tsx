'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import BrandGuidelinesSection from '@/components/brand-guidelines-section'
import FilePreviewModal from '@/components/file-preview-modal'
import type {
  ClientFilesLibrary,
  ProjectAttachmentWithUsage,
  ClientProjectSummary,
} from '@/lib/projects/types'
import {
  fetchAttachmentDownloadUrl,
  fetchOrganizationFilesLibrary,
  uploadProjectFiles,
} from '@/lib/projects/fetch-project-files'
import { removeLibraryAttachment } from '@/lib/projects/remove-library-attachment'
import { bricolage_grot600 } from '@/styles/fonts'
import { Download, FileText, FolderKanban, Loader2, Play, Search, Trash2, Upload } from 'lucide-react'

type AdminFilesSectionProps = {
  organizationId: string
  projects: ClientProjectSummary[]
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
  fetchDownloadUrl,
  projectTitle,
  onDelete,
  deleting = false,
}: {
  file: ProjectAttachmentWithUsage
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
  fetchDownloadUrl: (attachmentId: string) => Promise<string | null>
  projectTitle?: string
  onDelete?: (file: ProjectAttachmentWithUsage) => Promise<void>
  deleting?: boolean
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const isImage = file.mimeType.startsWith('image/')
  const isVideo = file.mimeType.startsWith('video/')

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

  const onDeleteClick = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!onDelete) return
    const confirmMessage = file.usedInThreads
      ? `Remove "${file.fileName}" from the library and all conversations?`
      : `Remove "${file.fileName}" from project files?`
    if (!window.confirm(confirmMessage)) return
    await onDelete(file)
  }

  return (
    <li className="flex flex-col gap-3 border-b border-chambray/6 px-5 py-4 last:border-0 lg:grid lg:grid-cols-[1fr_180px_110px_80px] lg:items-center lg:gap-4">
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
      <p className="truncate text-xs text-app-muted">{projectTitle ?? '—'}</p>
      <p className="text-xs text-app-muted">{formatRelativeTime(file.createdAt)}</p>
      <div className="flex items-center justify-between gap-2 lg:justify-end">
        <span className="text-xs text-app-muted">{formatBytes(file.sizeBytes)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => void onDownload(event)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sanmarino transition hover:bg-chambray/8 hover:text-chambray"
            aria-label={`Download ${file.fileName}`}
          >
            <Download className="h-4 w-4" aria-hidden />
          </button>
          {onDelete ? (
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

function ProjectGroup({
  group,
  onRefresh,
  onPreview,
  onDeleteFile,
  deletingAttachmentId,
}: {
  group: ClientFilesLibrary['projects'][number]
  onRefresh: () => void
  onPreview: (file: ProjectAttachmentWithUsage, url: string | null) => void
  onDeleteFile: (file: ProjectAttachmentWithUsage, projectId: string) => Promise<void>
  deletingAttachmentId: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    const result = await uploadProjectFiles(group.projectId, Array.from(files))
    if (!result.ok) setError(result.message ?? 'Upload failed')
    if (result.ok) onRefresh()
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const totalCount = group.libraryUploads.length + group.usedInThreads.length

  return (
    <section className="admin-glass-card overflow-hidden">
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
            className="admin-btn-ghost inline-flex items-center gap-2 text-sm"
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
      {error ? <p className="px-5 py-3 text-sm text-red-700">{error}</p> : null}

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
                  onDelete={(item) => onDeleteFile(item, group.projectId)}
                  deleting={deletingAttachmentId === file.id}
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
                  onDelete={(item) => onDeleteFile(item, group.projectId)}
                  deleting={deletingAttachmentId === file.id}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default function AdminFilesSection({
  organizationId,
  projects,
}: AdminFilesSectionProps) {
  const queryClient = useQueryClient()
  const [library, setLibrary] = useState<ClientFilesLibrary>({
    projects: [],
    files: [],
    nextCursor: null,
  })
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    file: ProjectAttachmentWithUsage
    url: string | null
  } | null>(null)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const search = query.trim()
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const data = await fetchOrganizationFilesLibrary(organizationId, {
      projectId: projectId || undefined,
      q: search || undefined,
    })
    if (!data) {
      setError('Could not load files')
      setLoading(false)
      return
    }
    setLibrary(data)
    setLoading(false)
  }, [organizationId, projectId, search])

  useEffect(() => {
    void load()
  }, [load])

  const projectOptions = useMemo(
    () => projects.map((project) => ({ id: project.id, title: project.title })),
    [projects],
  )

  const handleDeleteFile = useCallback(
    async (file: ProjectAttachmentWithUsage, projectId: string) => {
      setDeletingAttachmentId(file.id)
      setDeleteError(null)
      const result = await removeLibraryAttachment(queryClient, {
        attachmentId: file.id,
        organizationId,
        projectId,
      })
      if (!result.ok) {
        setDeleteError(result.message)
      } else {
        await load()
      }
      setDeletingAttachmentId(null)
    },
    [load, organizationId, queryClient],
  )

  const flatMatches = library.files ?? []

  return (
    <div className="space-y-4">
      <BrandGuidelinesSection organizationId={organizationId} />

      <section className="admin-glass-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files in this organization"
              className="admin-input w-full pl-9"
            />
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="admin-input w-full lg:min-w-[220px] lg:w-auto"
          >
            <option value="">All projects</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => void load()} className="admin-btn-ghost text-sm">
            Apply
          </button>
        </div>
      </section>

      {deleteError ? (
        <p className="admin-glass-card p-4 text-sm text-red-700">{deleteError}</p>
      ) : null}

      {loading ? (
        <div className="admin-glass-card flex items-center justify-center gap-2 p-12 text-sm text-app-muted">
          <Loader2 className="h-5 w-5 animate-spin text-sanmarino" aria-hidden />
          Loading files…
        </div>
      ) : error ? (
        <p className="admin-glass-card p-6 text-sm text-red-700">{error}</p>
      ) : search ? (
        <section className="admin-glass-card overflow-hidden">
          <div className="hidden border-b border-chambray/8 bg-chambray/[0.03] px-5 py-3 text-xs font-medium tracking-wide text-app-muted uppercase dark:border-white/10 dark:bg-white/5 lg:grid lg:grid-cols-[1fr_180px_110px_80px] lg:gap-4">
            <span>File</span>
            <span>Project</span>
            <span>Updated</span>
            <span className="text-right">Size</span>
          </div>
          {flatMatches.length === 0 ? (
            <p className="px-5 py-8 text-sm text-app-muted">No files match your search.</p>
          ) : (
            <ul>
              {flatMatches.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  fetchDownloadUrl={fetchAttachmentDownloadUrl}
                  projectTitle={file.projectTitle}
                  onPreview={(item, url) => setPreview({ file: item, url })}
                  onDelete={(item) => handleDeleteFile(item, item.projectId)}
                  deleting={deletingAttachmentId === file.id}
                />
              ))}
            </ul>
          )}
        </section>
      ) : library.projects.length === 0 ? (
        <section className="admin-glass-card p-8 text-center">
          <p className={`text-chambray ${bricolage_grot600.className}`}>No project files yet</p>
          <p className="mt-2 text-sm text-app-muted">
            Upload files in Projects or attach them in message threads.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {library.projects.map((group) => (
            <ProjectGroup
              key={group.projectId}
              group={group}
              onRefresh={load}
              onPreview={(item, url) => setPreview({ file: item, url })}
              onDeleteFile={handleDeleteFile}
              deletingAttachmentId={deletingAttachmentId}
            />
          ))}
        </div>
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
