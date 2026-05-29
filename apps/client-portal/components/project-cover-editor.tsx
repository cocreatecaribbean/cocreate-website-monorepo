'use client'

import { ChangeEvent, useRef, useState } from 'react'
import ProjectCover from '@/components/project-cover'
import {
  registerProjectCover,
  removeProjectCover,
  requestProjectCoverUploadUrl,
} from '@/lib/projects/fetch-projects-client'
import { bricolage_grot500 } from '@/styles/fonts'

type ProjectCoverEditorProps = {
  projectId: string
  coverImageUrl?: string | null
  title: string
  onUpdated: (coverImageUrl: string | null) => void
  variant?: 'hero' | 'compact'
}

export default function ProjectCoverEditor({
  projectId,
  coverImageUrl,
  title,
  onUpdated,
  variant = 'hero',
}: ProjectCoverEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const mimeType = file.type || 'image/jpeg'
      const urlResult = await requestProjectCoverUploadUrl(projectId, {
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
      })
      if (!urlResult.ok) {
        throw new Error(urlResult.message)
      }

      const putResponse = await fetch(urlResult.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: file,
      })
      if (!putResponse.ok) {
        throw new Error('Upload failed')
      }

      const reg = await registerProjectCover(projectId, {
        storagePath: urlResult.data.storagePath,
      })
      if (!reg.ok) {
        throw new Error(reg.message)
      }

      onUpdated(reg.data.coverImageUrl ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update cover')
    } finally {
      setUploading(false)
    }
  }

  const onRemove = async () => {
    setRemoving(true)
    setError(null)
    try {
      const result = await removeProjectCover(projectId)
      if (!result.ok) {
        throw new Error(result.message)
      }
      onUpdated(result.data.coverImageUrl ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove cover')
    } finally {
      setRemoving(false)
    }
  }

  const busy = uploading || removing

  const controls = (
    <>
      <label
        className={`cursor-pointer rounded-full border border-chambray/12 bg-white/95 px-3 py-1.5 text-xs font-medium text-chambray shadow-sm hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white ${bricolage_grot500.className}`}
      >
        {uploading ? 'Uploading…' : 'Change cover'}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void onFileChange(e)}
        />
      </label>
      {coverImageUrl ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onRemove()}
          className="portal-btn-ghost text-xs"
        >
          {removing ? 'Removing…' : 'Remove cover'}
        </button>
      ) : null}
    </>
  )

  if (variant === 'compact') {
    return (
      <section className="portal-glass-card p-5 sm:p-6">
        <p className={`text-sm text-chambray ${bricolage_grot500.className}`}>List cover image</p>
        <p className="mt-1 text-xs text-app-muted">
          Shown on your project card in the projects list.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <ProjectCover
            coverImageUrl={coverImageUrl}
            alt={title}
            variant="card"
            className="h-20 w-32 shrink-0 rounded-lg"
          />
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
        </div>
        {error ? (
          <p className="portal-alert-error mt-3" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    )
  }

  return (
    <div className="relative">
      <ProjectCover
        coverImageUrl={coverImageUrl}
        alt={title}
        variant="hero"
        className="rounded-none sm:rounded-t-xl"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-end gap-2 bg-linear-to-t from-chambray/70 to-transparent p-3 pt-10">
        <label
          className={`cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-chambray shadow-sm hover:bg-white ${bricolage_grot500.className}`}
        >
          {uploading ? 'Uploading…' : 'Change cover'}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onFileChange(e)}
          />
        </label>
        {coverImageUrl ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRemove()}
            className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
