'use client'

import { useState } from 'react'
import OrganizationLogo from '@/components/organization-logo'
import {
  useDeleteOrganizationLogoMutation,
  useUpdateOrganizationLogoMutation,
} from '@/lib/api/mutations/profile'
import { bricolage_grot600 } from '@/styles/fonts'

type OrganizationLogoEditorProps = {
  organizationName: string
  logoUrl?: string | null
}

export default function OrganizationLogoEditor({
  organizationName,
  logoUrl,
}: OrganizationLogoEditorProps) {
  const updateLogoMutation = useUpdateOrganizationLogoMutation()
  const deleteLogoMutation = useDeleteOrganizationLogoMutation()
  const [error, setError] = useState<string | null>(null)

  const uploading = updateLogoMutation.isPending
  const removing = deleteLogoMutation.isPending

  const onFileChange = async (file: File | null) => {
    if (!file) return
    setError(null)
    try {
      await updateLogoMutation.mutateAsync(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload logo')
    }
  }

  const onRemove = async () => {
    setError(null)
    try {
      await deleteLogoMutation.mutateAsync()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove logo')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <OrganizationLogo name={organizationName} logoUrl={logoUrl} size="md" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="portal-btn-ghost cursor-pointer text-sm">
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
              className="text-sm text-app-muted transition hover:text-red-600"
            >
              {removing ? 'Removing…' : 'Remove logo'}
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-app-muted">
        Shown in the portal header, Social Listening, and PDF reports. JPEG, PNG, or WebP up to
        5 MB.
      </p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type OrganizationBrandingSectionProps = {
  organizationName: string
  logoUrl?: string | null
}

export function OrganizationBrandingSection({
  organizationName,
  logoUrl,
}: OrganizationBrandingSectionProps) {
  return (
    <section className="portal-glass-card portal-animate-in p-6 sm:p-8">
      <p className="portal-eyebrow">Organization</p>
      <h3 className={`mt-2 text-lg text-app-heading ${bricolage_grot600.className}`}>
        Company branding
      </h3>
      <p className="mt-1 text-sm text-app-muted">
        Upload your company logo for your team and CoCreate deliverables.
      </p>
      <div className="mt-6">
        <OrganizationLogoEditor organizationName={organizationName} logoUrl={logoUrl} />
      </div>
    </section>
  )
}
