'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClientFilesLibrary, ProjectAttachment } from '@/lib/projects/api-types'
import {
  fetchProjectFiles,
  uploadProjectFiles,
} from '@/lib/projects/fetch-projects-client'
import { FileText, Paperclip, X } from 'lucide-react'

type MessageAttachmentComposerProps = {
  projectId: string
  variant?: 'portal' | 'admin'
  disabled?: boolean
  selectedIds: string[]
  pendingFiles: File[]
  onSelectedIdsChange: (ids: string[]) => void
  onPendingFilesChange: (files: File[]) => void
}

export default function MessageAttachmentComposer({
  projectId,
  variant = 'portal',
  disabled = false,
  selectedIds,
  pendingFiles,
  onSelectedIdsChange,
  onPendingFilesChange,
}: MessageAttachmentComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [library, setLibrary] = useState<ClientFilesLibrary | null>(null)
  const [loading, setLoading] = useState(false)

  const btnClass = `${variant === 'admin' ? 'admin-btn-ghost' : 'portal-btn-ghost'} inline-flex items-center gap-2 text-sm`

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void fetchProjectFiles(projectId)
      .then(setLibrary)
      .finally(() => setLoading(false))
  }, [open, projectId])

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

  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [
    ...selectedIds.map((id) => {
      const file =
        libraryFiles.find((item) => item.id === id) ??
        ({ fileName: 'Attached file' } as ProjectAttachment)
      return {
        key: id,
        label: file.fileName,
        onRemove: () => onSelectedIdsChange(selectedIds.filter((value) => value !== id)),
      }
    }),
    ...pendingFiles.map((file, index) => ({
      key: `pending-${file.name}-${index}`,
      label: file.name,
      onRemove: () =>
        onPendingFilesChange(pendingFiles.filter((_, fileIndex) => fileIndex !== index)),
    })),
  ]

  return (
    <div className="space-y-2">
      <div className="relative flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
          className={btnClass}
          aria-expanded={open}
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          Attach files
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={btnClass}
        >
          Upload from computer
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
          <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-md rounded-xl border border-chambray/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-chambray">
            <p className="mb-2 text-xs font-medium tracking-wide text-app-muted uppercase">
              Project library
            </p>
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
                      <FileText className="h-4 w-4 shrink-0 text-sanmarino" aria-hidden />
                      <span className="min-w-0 truncate">{file.fileName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li
              key={chip.key}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-chambray/10 bg-chambray/[0.03] px-2 py-1 text-xs text-chambray"
            >
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-full p-0.5 hover:bg-chambray/10"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Upload pending files to library and return their attachment IDs. */
export async function resolvePendingMessageAttachments(
  projectId: string,
  pendingFiles: File[],
): Promise<{ ok: boolean; attachmentIds: string[]; message?: string }> {
  if (!pendingFiles.length) return { ok: true, attachmentIds: [] }
  const result = await uploadProjectFiles(projectId, pendingFiles)
  if (!result.ok) {
    return { ok: false, attachmentIds: [], message: result.message }
  }
  return { ok: true, attachmentIds: result.attachmentIds ?? [] }
}
