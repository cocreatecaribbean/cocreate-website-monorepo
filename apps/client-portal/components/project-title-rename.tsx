'use client'

import { useEffect, useId, useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'

type ProjectTitleRenameProps = {
  title: string
  headingClassName: string
  inputClassName: string
  disabled?: boolean
  onSave: (title: string) => Promise<void>
}

export default function ProjectTitleRename({
  title,
  headingClassName,
  inputClassName,
  disabled = false,
  onSave,
}: ProjectTitleRenameProps) {
  const inputId = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) setDraft(title)
  }, [title, editing])

  const cancel = () => {
    setDraft(title)
    setError(null)
    setEditing(false)
  }

  const save = async () => {
    const next = draft.trim()
    if (next.length < 2) {
      setError('Title must be at least 2 characters')
      return
    }
    if (next === title) {
      setEditing(false)
      setError(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(next)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename project')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-start gap-2">
        <h1 className={`min-w-0 ${headingClassName}`}>{title}</h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={disabled}
          className="mt-1 shrink-0 rounded-lg p-1.5 text-app-muted transition hover:bg-chambray/8 hover:text-chambray disabled:opacity-50"
          aria-label="Rename project"
          title="Rename project"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Project title
        </label>
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void save()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
          maxLength={200}
          disabled={saving}
          autoFocus
          className={`${inputClassName} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg p-1.5 text-sanmarino transition hover:bg-sanmarino/10 disabled:opacity-50"
          aria-label="Save project name"
          title="Save"
        >
          <Check className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="rounded-lg p-1.5 text-app-muted transition hover:bg-chambray/8 hover:text-chambray disabled:opacity-50"
          aria-label="Cancel rename"
          title="Cancel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
