'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AttachmentPreviewChip,
  FileMediaTile,
} from '@cocreate/app-ui/file-media-tile'
import type { ClientFilesLibrary, ProjectAttachment } from '@/lib/projects/types'
import {
  fetchAttachmentDownloadUrl,
  fetchProjectFiles,
  uploadProjectFiles,
} from '@/lib/projects/fetch-project-files'
import { Paperclip, X } from 'lucide-react'
import { useDismissOnOutsideClickAndEscape } from '@/lib/use-dismiss-on-outside-click'

type MessageAttachmentComposerProps = {
  projectId: string
  disabled?: boolean
  libraryVisibility?: 'CLIENT' | 'INTERNAL'
  selectedIds: string[]
  pendingFiles: File[]
  onSelectedIdsChange: (ids: string[]) => void
  onPendingFilesChange: (files: File[]) => void
  /** Participate in a parent flex toolbar (chips wrap full-width above actions). */
  toolbar?: boolean
}

export default function MessageAttachmentComposer({
  projectId,
  disabled = false,
  libraryVisibility,
  selectedIds,
  pendingFiles,
  onSelectedIdsChange,
  onPendingFilesChange,
  toolbar = false,
}: MessageAttachmentComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [library, setLibrary] = useState<ClientFilesLibrary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void fetchProjectFiles(
      projectId,
      libraryVisibility ? { visibility: libraryVisibility } : undefined,
    )
      .then(setLibrary)
      .finally(() => setLoading(false))
  }, [open, projectId, libraryVisibility])

  useDismissOnOutsideClickAndEscape(open, popoverRef, () => setOpen(false))

  const libraryFiles: ProjectAttachment[] =
    library?.projects.flatMap((project) => [
      ...project.libraryUploads,
      ...project.usedInThreads,
    ]) ?? []

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((value) => value !== id))
    } else {
      onSelectedIdsChange([...selectedIds, id])
    }
  }

  const chipList =
    selectedIds.length > 0 || pendingFiles.length > 0 ? (
      <ul className={`flex flex-wrap gap-2 ${toolbar ? 'w-full basis-full' : ''}`}>
        {selectedIds.map((id) => {
          const file =
            libraryFiles.find((item) => item.id === id) ??
            ({
              id,
              fileName: 'Attached file',
              mimeType: 'application/octet-stream',
            } as ProjectAttachment)
          return (
            <AttachmentPreviewChip
              key={id}
              fileName={file.fileName}
              mimeType={file.mimeType}
              fetchUrl={() => fetchAttachmentDownloadUrl(id)}
              onRemove={() =>
                onSelectedIdsChange(selectedIds.filter((value) => value !== id))
              }
            />
          )
        })}
        {pendingFiles.map((file, index) => (
          <AttachmentPreviewChip
            key={`pending-${file.name}-${index}`}
            fileName={file.name}
            mimeType={file.type || 'application/octet-stream'}
            localFile={file}
            onRemove={() =>
              onPendingFilesChange(
                pendingFiles.filter((_, fileIndex) => fileIndex !== index),
              )
            }
          />
        ))}
      </ul>
    ) : null

  const actions = (
    <div ref={popoverRef} className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="admin-btn-ghost inline-flex min-h-10 items-center gap-2 px-3 text-sm"
        aria-expanded={open}
        aria-label="Attach files from project library"
      >
        <Paperclip className="h-4 w-4" aria-hidden />
        <span className="md:hidden">Attach</span>
        <span className="hidden md:inline">Attach files</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="admin-btn-ghost inline-flex min-h-10 items-center gap-2 px-3 text-sm"
        aria-label="Upload from computer"
      >
        <span className="md:hidden">Upload</span>
        <span className="hidden md:inline">Upload from computer</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          const next = e.target.files ? Array.from(e.target.files) : []
          if (next.length) onPendingFilesChange([...pendingFiles, ...next])
          if (inputRef.current) inputRef.current.value = ''
        }}
      />
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-[min(100vw-2rem,24rem)] max-w-md rounded-xl border border-chambray/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-chambray">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-app-muted uppercase">
              Project library
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-chambray/10"
              aria-label="Close file picker"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-app-muted">Loading…</p>
          ) : libraryFiles.length === 0 ? (
            <p className="text-sm text-app-muted">No files in this project yet.</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {libraryFiles.map((file) => (
                <li key={file.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-chambray/5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(file.id)}
                      onChange={() => toggleId(file.id)}
                      className="rounded border-chambray/20"
                    />
                    <FileMediaTile
                      fileName={file.fileName}
                      mimeType={file.mimeType}
                      size="sm"
                      className="h-8 w-8"
                      fetchUrl={() => fetchAttachmentDownloadUrl(file.id)}
                    />
                    <span className="min-w-0 truncate">{file.fileName}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )

  if (toolbar) {
    return (
      <>
        {chipList}
        {actions}
      </>
    )
  }

  return (
    <div className="space-y-2">
      {actions}
      {chipList}
    </div>
  )
}

export async function resolvePendingMessageAttachments(
  projectId: string,
  pendingFiles: File[],
  options?: { visibility?: 'CLIENT' | 'INTERNAL' },
): Promise<{ ok: boolean; attachmentIds: string[]; message?: string }> {
  if (!pendingFiles.length) return { ok: true, attachmentIds: [] }
  const result = await uploadProjectFiles(projectId, pendingFiles, options)
  if (!result.ok) return { ok: false, attachmentIds: [], message: result.message }
  return { ok: true, attachmentIds: result.attachmentIds ?? [] }
}
