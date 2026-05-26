'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { UserCircle } from 'lucide-react'
import AdminToast from '@/components/admin-toast'
import { useAdminSession } from '@/components/admin-session-provider'
import { isSuperAdminSession } from '@/lib/admin-session'

type ProfileOption = { id: string; label: string }

type AdminProfile = {
  displayName: string | null
  jobTitle: string | null
  jobTitleLabels: string[]
  jobTitleOptionIds: string[]
  avatarUrl: string | null
  email: string
  profileComplete: boolean
  updatedAt: string
}

export default function AdminProfileForm() {
  const { session } = useAdminSession()
  const isSuperAdmin = isSuperAdminSession(session?.role ?? null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [jobTitleOptions, setJobTitleOptions] = useState<ProfileOption[]>([])
  const [displayName, setDisplayName] = useState('')
  const [selectedJobTitleIds, setSelectedJobTitleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, optionsRes] = await Promise.all([
        fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>('/api/profile'),
        fetchAdminBff<{
          ok: boolean
          jobTitles?: ProfileOption[]
        }>('/api/profile-options'),
      ])
      if (optionsRes.jobTitles) setJobTitleOptions(optionsRes.jobTitles)
      if (profileRes.profile) {
        setProfile(profileRes.profile)
        setDisplayName(profileRes.profile.displayName ?? '')
        setSelectedJobTitleIds(profileRes.profile.jobTitleOptionIds ?? [])
      }
    } catch {
      setToast('Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggleJobTitle = (id: string) => {
    setSelectedJobTitleIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)
    try {
      const data = await fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>(
        '/api/profile',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName,
            jobTitleOptionIds: selectedJobTitleIds,
          }),
        },
      )
      if (data.profile) {
        setProfile(data.profile)
        setSelectedJobTitleIds(data.profile.jobTitleOptionIds ?? [])
        setToast('Profile saved')
      }
    } catch {
      setToast('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const onAvatarChange = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setToast(null)
    try {
      const urlRes = await fetchAdminBff<{
        ok: boolean
        storagePath?: string
        signedUrl?: string
      }>('/api/profile/avatar/upload-url', {
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
      if (!upload.ok) throw new Error('Upload failed')

      const reg = await fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>(
        '/api/profile/avatar',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: urlRes.storagePath }),
        },
      )
      if (reg.profile) {
        setProfile(reg.profile)
        setToast('Photo updated')
      }
    } catch {
      setToast('Could not upload photo')
    } finally {
      setUploading(false)
    }
  }

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
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onAvatarChange(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-app-muted">JPG or PNG, max 5 MB</p>
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

      {toast ? (
        <AdminToast message={toast} variant="success" onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  )
}
