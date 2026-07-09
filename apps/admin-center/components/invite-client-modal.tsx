'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import DevSignInLink from '@/components/dev-sign-in-link'
import { getApiErrorMessage } from '@/lib/api-error'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { bricolage_grot600 } from '@/styles/fonts'

type InviteClientModalProps = {
  open: boolean
  onClose: () => void
  onInvited?: (message: string) => void
}

export default function InviteClientModal({
  open,
  onClose,
  onInvited,
}: InviteClientModalProps) {
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [enableSocialListening, setEnableSocialListening] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const resetForm = () => {
    setCompanyName('')
    setClientEmail('')
    setEnableSocialListening(false)
    setLogoUrl('')
    setLogoFileName(null)
    setError(null)
    setDevSignInUrl(null)
  }

  const onLogoChange = async (file: File | null) => {
    if (!file) return
    setLogoUploading(true)
    setError(null)
    try {
      const urlRes = await fetchAdminBff<{
        signedUrl?: string
        publicUrl?: string
      }>('/api/clients/logo/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.signedUrl || !urlRes.publicUrl) {
        throw new Error('Upload URL missing')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!upload.ok) throw new Error('Logo upload failed')

      setLogoUrl(urlRes.publicUrl)
      setLogoFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload logo')
    } finally {
      setLogoUploading(false)
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setDevSignInUrl(null)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          clientEmail,
          enableSocialListening,
          ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, `Invite failed (HTTP ${response.status})`),
        )
      }
      const payload = data as {
        invitation?: { devSignInUrl?: string }
      }
      resetForm()
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
      if (payload.invitation?.devSignInUrl) {
        setDevSignInUrl(payload.invitation.devSignInUrl)
        onInvited?.(
          'Organization owner invited. Open the dev sign-in link below (no email sent).',
        )
      } else {
        onInvited?.(
          'Organization owner invited. They will receive a sign-in email shortly.',
        )
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite client')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-chambray/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-client-title"
        className="admin-glass-card max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Onboard</p>
            <h2
              id="invite-client-title"
              className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}
            >
              Invite client organization
            </h2>
            <p className="mt-1 text-sm text-app-muted">
              The email below becomes the org owner (super user) for this company.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn-ghost shrink-0 p-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          {error ? (
            <p className="admin-alert-error text-sm">{error}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Company name"
              className="admin-input"
            />
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
              placeholder="client@company.com"
              className="admin-input"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="admin-btn-ghost cursor-pointer text-sm">
              {logoUploading ? 'Uploading…' : 'Upload client logo (optional)'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={logoUploading}
                onChange={(e) => void onLogoChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {logoUrl && !logoUploading ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-8 w-auto max-w-[120px] rounded object-contain"
              />
            ) : logoFileName && !logoUploading ? (
              <span className="text-sm text-app-muted">{logoFileName}</span>
            ) : null}
            {logoUrl ? (
              <button
                type="button"
                onClick={() => {
                  setLogoUrl('')
                  setLogoFileName(null)
                }}
                className="text-xs text-app-muted hover:text-chambray"
              >
                Remove
              </button>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-app-primary">
            <input
              type="checkbox"
              checked={enableSocialListening}
              onChange={(event) => setEnableSocialListening(event.target.checked)}
              className="h-4 w-4 rounded border-chambray/30 text-chambray focus:ring-sanmarino"
            />
            Enable Social Listening on invite (optional)
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={submitting} className="admin-btn-primary text-sm">
              {submitting ? 'Sending invite…' : 'Invite client'}
            </button>
            <button type="button" onClick={onClose} className="admin-btn-ghost text-sm">
              Cancel
            </button>
          </div>
        </form>

        {devSignInUrl ? (
          <div className="mt-4">
            <DevSignInLink url={devSignInUrl} label="Open client sign-in link" />
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
