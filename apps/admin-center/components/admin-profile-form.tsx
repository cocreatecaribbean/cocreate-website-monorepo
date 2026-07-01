'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import AdminToast from '@/components/admin-toast'
import AvatarCropModal from '@/components/avatar-crop-modal'
import { useAdminSession } from '@/components/admin-session-provider'
import {
  resolveAvatarMimeType,
  useUpdateAdminAvatarMutation,
  useUpdateAdminProfileMutation,
} from '@/lib/api/mutations/profile'
import { useAdminProfileQuery, useProfileOptionsQuery } from '@/lib/api/queries/profile'
import { isSuperAdminSession } from '@/lib/admin-session'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export default function AdminProfileForm() {
  const { session } = useAdminSession()
  const isSuperAdmin = isSuperAdminSession(session?.role ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileQuery = useAdminProfileQuery()
  const optionsQuery = useProfileOptionsQuery()
  const updateProfileMutation = useUpdateAdminProfileMutation()
  const updateAvatarMutation = useUpdateAdminAvatarMutation()

  const profile = profileQuery.data?.profile ?? null
  const jobTitleOptions = optionsQuery.data?.jobTitles ?? []

  const [displayName, setDisplayName] = useState('')
  const [selectedJobTitleIds, setSelectedJobTitleIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const [initialized, setInitialized] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)

  useEffect(() => {
    if (!profile || initialized) return
    setDisplayName(profile.displayName ?? '')
    setSelectedJobTitleIds(profile.jobTitleOptionIds ?? [])
    setInitialized(true)
  }, [profile, initialized])

  useEffect(() => {
    if (profileQuery.isError || optionsQuery.isError) {
      setToastVariant('error')
      setToast('Could not load profile')
    }
  }, [profileQuery.isError, optionsQuery.isError])

  useEffect(() => {
    return () => {
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    }
  }, [cropImageSrc])

  const showToast = (message: string, variant: 'success' | 'error') => {
    setToastVariant(variant)
    setToast(message)
  }

  const closeCropModal = () => {
    setCropModalOpen(false)
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc)
      setCropImageSrc(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleJobTitle = (id: string) => {
    setSelectedJobTitleIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setToast(null)
    try {
      const data = await updateProfileMutation.mutateAsync({
        displayName,
        jobTitleOptionIds: selectedJobTitleIds,
      })
      if (data.profile) {
        setSelectedJobTitleIds(data.profile.jobTitleOptionIds ?? [])
        showToast('Profile saved', 'success')
      }
    } catch {
      showToast('Could not save profile', 'error')
    }
  }

  const onAvatarFileSelected = (file: File | null) => {
    if (!file) return
    setToast(null)

    if (file.size > MAX_AVATAR_BYTES) {
      showToast('Image must be 5 MB or smaller', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      resolveAvatarMimeType(file.name, file.type)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Avatar must be a JPEG, PNG, or WebP image',
        'error',
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    const objectUrl = URL.createObjectURL(file)
    setCropImageSrc(objectUrl)
    setCropModalOpen(true)
  }

  const onAvatarCropped = async (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    try {
      const reg = await updateAvatarMutation.mutateAsync(file)
      if (reg.profile) {
        showToast('Photo updated', 'success')
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not upload photo',
        'error',
      )
      throw err
    }
  }

  const loading = profileQuery.isLoading || optionsQuery.isLoading
  const saving = updateProfileMutation.isPending
  const uploading = updateAvatarMutation.isPending

  if (loading) {
    return <p className="text-sm text-app-muted">Loading profile…</p>
  }

  const needsName = !profile?.profileComplete

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {needsName ? (
        <div className="admin-alert rounded-xl border border-casablanca/30 bg-casablanca/10 px-4 py-3 text-sm text-chambray">
          Set your display name so clients see who onboarded projects, sent messages, and
          marked work complete.
        </div>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="admin-surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-chambray/10 ring-2 ring-chambray/10">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-chambray/40">
                <UserCircle className="h-14 w-14" strokeWidth={1.25} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className={`text-chambray ${bricolage_grot600.className}`}>Profile photo</p>
            <label className="admin-btn-ghost cursor-pointer text-sm">
              {uploading ? 'Uploading…' : 'Upload image'}
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ACCEPT}
                className="sr-only"
                disabled={uploading || cropModalOpen}
                onChange={(e) => onAvatarFileSelected(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-app-muted">JPG, PNG, or WebP, max 5 MB</p>
          </div>
        </div>

        <div>
          <p className={`text-xl text-chambray ${bricolage_grot700.className}`}>Your profile</p>
          <p className="mt-1 text-sm text-app-muted">{profile?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-chambray" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
              className="admin-input mt-1.5 w-full"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-chambray">Job titles</legend>
            <p className="mt-1 text-xs text-app-muted">
              Select all that apply. Shown to clients next to your name on project actions.
            </p>
            {jobTitleOptions.length === 0 ? (
              <p className="mt-3 text-sm text-app-muted">No job titles available yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {jobTitleOptions.map((option) => (
                  <li key={option.id}>
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-chambray">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-chambray/30 text-chambray focus:ring-chambray/30"
                        checked={selectedJobTitleIds.includes(option.id)}
                        onChange={() => toggleJobTitle(option.id)}
                      />
                      {option.label}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {isSuperAdmin ? (
              <p className="mt-3 text-xs">
                <Link
                  href="/settings/agency-profile"
                  className="text-chambray underline underline-offset-2"
                >
                  Add or remove job titles for the agency
                </Link>
              </p>
            ) : null}
          </fieldset>
        </div>

        <button type="submit" disabled={saving} className="admin-btn-primary text-sm">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <AvatarCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={closeCropModal}
        onConfirm={onAvatarCropped}
      />

      {toast ? (
        <AdminToast
          message={toast}
          variant={toastVariant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  )
}
