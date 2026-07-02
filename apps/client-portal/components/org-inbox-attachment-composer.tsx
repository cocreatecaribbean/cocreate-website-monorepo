'use client'

import { useRef } from 'react'
import { Paperclip, X } from 'lucide-react'

type OrgInboxAttachmentComposerProps = {
  disabled?: boolean
  pendingFiles: File[]
  onPendingFilesChange: (files: File[]) => void
}

export default function OrgInboxAttachmentComposer({
  disabled = false,
  pendingFiles,
  onPendingFilesChange,
}: OrgInboxAttachmentComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="portal-btn-ghost inline-flex items-center gap-2 text-sm"
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
            <li
              key={`${file.name}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-chambray/10 bg-chambray/[0.03] px-2 py-1 text-xs text-chambray"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() =>
                  onPendingFilesChange(
                    pendingFiles.filter((_, fileIndex) => fileIndex !== index),
                  )
                }
                className="rounded-full p-0.5 hover:bg-chambray/10"
                aria-label={`Remove ${file.name}`}
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
