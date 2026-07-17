'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, Download } from 'lucide-react'
import { FileMediaTile } from '@cocreate/app-ui/file-media-tile'
import FilePreviewModal from '@/components/file-preview-modal'
import { queryKeys } from '@/lib/api/query-keys'
import {
  fetchProjectTopPicks,
  fetchAttachmentDownloadUrl,
} from '@/lib/projects/fetch-projects-client'
import type {
  ProjectAttachmentWithReactions,
  ProjectFileReactionTag,
} from '@/lib/projects/api-types'
import { bricolage_grot600 } from '@/styles/fonts'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function TagChip({
  tag,
  active,
  onToggle,
}: {
  tag: ProjectFileReactionTag
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-sanmarino/20 text-chambray ring-1 ring-sanmarino/40'
          : 'bg-chambray/5 text-app-muted hover:bg-chambray/10'
      }`}
    >
      {tag.label}
      {tag.count > 0 ? ` (${tag.count})` : ''}
    </button>
  )
}

function FileCard({
  file,
  onPreview,
}: {
  file: ProjectAttachmentWithReactions
  onPreview: (file: ProjectAttachmentWithReactions, url: string | null) => void
}) {
  const [downloading, setDownloading] = useState(false)

  const resolveUrl = async () => {
    const result = await fetchAttachmentDownloadUrl(file.id)
    return result.url
  }

  const openPreview = async () => {
    const url = await resolveUrl()
    onPreview(file, url)
  }

  const openDownload = async () => {
    setDownloading(true)
    const url = await resolveUrl()
    setDownloading(false)
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  return (
    <article className="portal-glass-card flex flex-col gap-3 overflow-hidden p-3">
      <FileMediaTile
        fileName={file.fileName}
        mimeType={file.mimeType}
        size="lg"
        fetchUrl={resolveUrl}
        onClick={() => void openPreview()}
        className="min-h-40"
      />
      <div className="min-w-0 px-1">
        <p className={`truncate text-sm text-chambray ${bricolage_grot600.className}`}>
          {file.fileName}
        </p>
        <p className="mt-0.5 text-xs text-app-muted">
          {formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleDateString()}
        </p>
      </div>

      {file.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-1">
          {file.tags.map((tag) => (
            <span
              key={tag.kind}
              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                tag.isPositive
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-casablanca/15 text-chambray'
              }`}
            >
              {tag.label}
              {tag.count > 1 ? ` · ${tag.count}` : ''}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void openDownload()}
        disabled={downloading}
        className="portal-btn-ghost inline-flex items-center gap-2 self-start text-sm"
      >
        <Download className="h-4 w-4" aria-hidden />
        {downloading ? 'Downloading…' : 'Download'}
      </button>
    </article>
  )
}

export default function PortalProjectTopPicksPanel({ projectId }: { projectId: string }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preview, setPreview] = useState<{
    file: ProjectAttachmentWithReactions
    url: string | null
  } | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.topPicks.all, 'project', projectId, selectedTags],
    queryFn: () => fetchProjectTopPicks(projectId, selectedTags),
  })

  const toggleTag = (kind: string) => {
    setSelectedTags((prev) =>
      prev.includes(kind) ? prev.filter((t) => t !== kind) : [...prev, kind],
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sanmarino/10 p-2.5 text-sanmarino">
          <Star className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className={`text-chambray ${bricolage_grot600.className}`}>Top Picks</p>
          <p className="mt-1 text-sm text-app-muted">
            Files your team reacted to on this project.
          </p>
        </div>
      </div>

      {data?.availableTags && data.availableTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.availableTags.map((tag) => (
            <TagChip
              key={tag.kind}
              tag={tag}
              active={selectedTags.includes(tag.kind)}
              onToggle={() => toggleTag(tag.kind)}
            />
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-app-muted">Loading top picks…</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">
          {error instanceof Error ? error.message : 'Could not load top picks'}
        </p>
      ) : !data?.items.length ? (
        <p className="text-sm text-app-muted">No top picks for this project yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onPreview={(item, url) => setPreview({ file: item, url })}
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
