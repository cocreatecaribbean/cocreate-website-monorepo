'use client'

import { useState } from 'react'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'

type AdminOrganizationLogoEditorProps = {
  organizationId: string
  organizationName: string
  logoUrl?: string | null
  onUpdated?: () => void
}

export default function AdminOrganizationLogoEditor({
  organizationId,
  organizationName,
  logoUrl,
  onUpdated,
}: AdminOrganizationLogoEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFileChange = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const urlRes = await fetchAdminBff<{
        signedUrl?: string
        storagePath?: string
      }>(`/api/clients/${organizationId}/logo/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.signedUrl || !urlRes.storagePath) {
        throw new Error('Upload URL missing')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!upload.ok) throw new Error('Logo upload failed')

      await fetchAdminBff(`/api/clients/${organizationId}/logo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: urlRes.storagePath }),
      })

      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload logo')
    } finally {
      setUploading(false)
    }
  }

  const onRemove = async () => {
    setRemoving(true)
    setError(null)
    try {
      await fetchAdminBff(`/api/clients/${organizationId}/logo`, { method: 'DELETE' })
      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove logo')
    } finally {
      setRemoving(false)
    }
  }

  const initials =
    organizationName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-app-muted">Company logo</p>
      <div className="flex flex-wrap items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${organizationName} logo`}
            className="h-10 w-10 rounded-full object-contain"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-chambray/10 text-xs font-semibold text-chambray">
            {initials}
          </span>
        )}
        <label className="admin-btn-ghost cursor-pointer text-sm">
          {uploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading || removing}
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {logoUrl ? (
          <button
            type="button"
            disabled={uploading || removing}
            onClick={() => void onRemove()}
            className="text-xs text-app-muted hover:text-chambray"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className={`text-xs text-red-600 ${bricolage_grot600.className}`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
