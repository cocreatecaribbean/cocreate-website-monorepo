'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, Download } from 'lucide-react'
import { FileMediaTile } from '@cocreate/app-ui/file-media-tile'
import FilePreviewModal from '@/components/file-preview-modal'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { fetchProjectTopPicks } from '@/lib/projects/fetch-top-picks'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import type {
  ProjectAttachmentWithReactions,
  ProjectFileReactionTag,
} from '@/lib/projects/types'
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

  const resolveUrl = () => fetchAttachmentDownloadUrl(file.id)

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
    <article className="admin-glass-card flex flex-col gap-3 overflow-hidden p-3">
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
              {tag.count > 1 ? ` ×${tag.count}` : ''}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void openDownload()}
        disabled={downloading}
        className="admin-btn-ghost mt-auto inline-flex items-center gap-2 self-start text-xs"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        {downloading ? 'Downloading…' : 'Download'}
      </button>
    </article>
  )
}

export default function AdminTopPicksPanel({ projectId }: { projectId: string }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preview, setPreview] = useState<{
    file: ProjectAttachmentWithReactions
    url: string | null
  } | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: adminQueryKeys.topPicks.project(projectId, selectedTags),
    queryFn: () => fetchProjectTopPicks(projectId, selectedTags),
  })

  const items = data?.items ?? []
  const availableTags = data?.availableTags ?? []

  const toggleTag = (kind: string) => {
    setSelectedTags((prev) =>
      prev.includes(kind) ? prev.filter((t) => t !== kind) : [...prev, kind],
    )
  }

  return (
    <div className="space-y-6">
      <section className="admin-glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sanmarino/10 p-2.5 text-sanmarino">
            <Star className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
              Top Picks
            </p>
            <h3 className={`text-lg text-chambray ${bricolage_grot600.className}`}>
              Files the client reacted to
            </h3>
          </div>
        </div>
        <p className="mt-3 text-sm text-app-muted">
          Deliverables with client reactions. Filter by reaction to see what resonated.
        </p>

        {availableTags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <TagChip
                key={tag.kind}
                tag={tag}
                active={selectedTags.includes(tag.kind)}
                onToggle={() => toggleTag(tag.kind)}
              />
            ))}
            {selectedTags.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-sanmarino hover:text-chambray"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <p className="text-sm text-app-muted">Loading top picks…</p>
      ) : isError ? (
        <section className="admin-glass-card space-y-3 p-6">
          <p className="text-sm text-app-muted">
            {error instanceof Error ? error.message : 'Could not load top picks.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="admin-btn-ghost text-sm"
          >
            Try again
          </button>
        </section>
      ) : items.length === 0 ? (
        <p className="admin-glass-card p-6 text-sm text-app-muted">
          {selectedTags.length > 0
            ? 'No files match the selected reactions.'
            : 'No client reactions on this project yet.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((file) => (
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
