'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import FilePreviewModal from '@/components/file-preview-modal'
import { formatRelativeTime } from '@/lib/format-relative-time'
import {
  deleteBrandAsset,
  fetchBrandAssetDownloadUrl,
  fetchBrandAssets,
  uploadBrandAssets,
} from '@/lib/projects/fetch-brand-assets'
import type { OrganizationBrandAsset } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'
import { BookOpen, Download, FileText, Loader2, Trash2, Upload } from 'lucide-react'

type BrandGuidelinesSectionProps = {
  organizationId: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function BrandFileRow({
  file,
  onPreview,
  onDeleted,
}: {
  file: OrganizationBrandAsset
  onPreview: (file: OrganizationBrandAsset, url: string | null) => void
  onDeleted: () => void
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isImage = file.mimeType.startsWith('image/')

  useEffect(() => {
    if (!isImage) return
    void fetchBrandAssetDownloadUrl(file.id).then(setThumbUrl)
  }, [file.id, isImage])

  const openPreview = async () => {
    const url = thumbUrl ?? (await fetchBrandAssetDownloadUrl(file.id))
    onPreview(file, url)
  }

  const onDownload = async (event: React.MouseEvent) => {
    event.stopPropagation()
    const url = thumbUrl ?? (await fetchBrandAssetDownloadUrl(file.id))
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  const onDelete = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!window.confirm(`Remove "${file.fileName}" from brand guidelines?`)) return
    setDeleting(true)
    const result = await deleteBrandAsset(file.id)
    setDeleting(false)
    if (result.ok) onDeleted()
  }

  return (
    <li className="flex flex-col gap-3 border-b border-chambray/6 px-5 py-4 last:border-0 lg:grid lg:grid-cols-[1fr_110px_80px_72px] lg:items-center lg:gap-4">
      <button
        type="button"
        onClick={() => void openPreview()}
        className="group flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-chambray/6"
        aria-label={`Preview ${file.fileName}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-casablanca/20 text-chambray ring-1 ring-casablanca/30">
          {isImage && thumbUrl ? (
            <img src={thumbUrl} alt={file.fileName} className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`truncate text-sm text-chambray underline-offset-4 transition group-hover:underline ${bricolage_grot600.className}`}
          >
            {file.fileName}
          </p>
          {file.uploadedByName ? (
            <p className="truncate text-xs text-app-muted">Uploaded by {file.uploadedByName}</p>
          ) : null}
        </div>
      </button>
      <p className="text-xs text-app-muted">{formatRelativeTime(file.createdAt)}</p>
      <span className="text-xs text-app-muted">{formatBytes(file.sizeBytes)}</span>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={(event) => void onDownload(event)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sanmarino transition hover:bg-chambray/8 hover:text-chambray"
          aria-label={`Download ${file.fileName}`}
        >
          <Download className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={(event) => void onDelete(event)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-700/80 transition hover:bg-red-500/10 hover:text-red-800"
          aria-label={`Delete ${file.fileName}`}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </li>
  )
}

export default function BrandGuidelinesSection({ organizationId }: BrandGuidelinesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<OrganizationBrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    file: OrganizationBrandAsset
    url: string | null
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const data = await fetchBrandAssets(organizationId)
    if (!data) {
      setError('Could not load brand guidelines')
      setAssets([])
    } else {
      setAssets(data)
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    const result = await uploadBrandAssets(organizationId, Array.from(files))
    if (!result.ok) setError(result.message ?? 'Upload failed')
    else await load()
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <section className="admin-glass-card overflow-hidden ring-1 ring-casablanca/25">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-casablanca/20 bg-linear-to-r from-casablanca/15 via-transparent to-sanmarino/10 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-casablanca/25 text-chambray">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>
                Brand guidelines
              </h3>
              <p className="mt-1 text-sm text-app-muted">
                Internal reference for this client&apos;s brand standards (admin team only).
              </p>
            </div>
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
              className="admin-btn-primary inline-flex items-center gap-2 text-sm"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              Upload brand files
            </button>
          </div>
        </div>

        {error ? <p className="px-5 py-3 text-sm text-red-700">{error}</p> : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-app-muted">
            <Loader2 className="h-5 w-5 animate-spin text-sanmarino" aria-hidden />
            Loading brand guidelines…
          </div>
        ) : assets.length === 0 ? (
          <p className="px-5 py-8 text-sm text-app-muted">
            No brand guidelines yet. Upload PDFs, logos, and style guides for your team.
          </p>
        ) : (
          <ul>
            {assets.map((file) => (
              <BrandFileRow
                key={file.id}
                file={file}
                onPreview={(item, url) => setPreview({ file: item, url })}
                onDeleted={() => void load()}
              />
            ))}
          </ul>
        )}
      </section>

      <FilePreviewModal
        open={Boolean(preview)}
        fileName={preview?.file.fileName ?? ''}
        mimeType={preview?.file.mimeType ?? ''}
        url={preview?.url ?? null}
        onClose={() => setPreview(null)}
      />
    </>
  )
}
