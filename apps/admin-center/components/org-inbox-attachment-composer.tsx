'use client'

import { useRef } from 'react'
import { AttachmentPreviewChip } from '@cocreate/app-ui/file-media-tile'
import { Paperclip } from 'lucide-react'

type OrgInboxAttachmentComposerProps = {
  disabled?: boolean
  pendingFiles: File[]
  onPendingFilesChange: (files: File[]) => void
  variant?: 'admin' | 'portal'
}

export default function OrgInboxAttachmentComposer({
  disabled = false,
  pendingFiles,
  onPendingFilesChange,
  variant = 'admin',
}: OrgInboxAttachmentComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const btnClass =
    variant === 'admin'
      ? 'admin-btn-ghost inline-flex items-center gap-2 text-sm'
      : 'portal-btn-ghost inline-flex items-center gap-2 text-sm'

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={btnClass}
      >
        <Paperclip className="h-4 w-4" aria-hidden />
        Attach files
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
      {pendingFiles.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {pendingFiles.map((file, index) => (
            <AttachmentPreviewChip
              key={`${file.name}-${index}`}
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
      ) : null}
    </div>
  )
}
