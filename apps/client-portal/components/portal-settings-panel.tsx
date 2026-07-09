'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/theme-toggle'
import PortalTeamPanel from '@/components/portal-team-panel'
import PortalUserAvatar from '@/components/portal-user-avatar'
import { OrganizationBrandingSection } from '@/components/organization-logo-editor'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { useUpdatePortalProfileMutation } from '@/lib/api/mutations/profile'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import { bricolage_grot600 } from '@/styles/fonts'
import { Settings } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

type PortalSettingsPanelProps = {
  showPreviewBanner?: boolean
}

export default function PortalSettingsPanel({
  showPreviewBanner = false,
}: PortalSettingsPanelProps) {
  const { data: profile } = usePortalProfileQuery()
  const updateProfileMutation = useUpdatePortalProfileMutation()
  const canManageTeam = Boolean(profile?.permissions.canManageOrgTeam)
  const canAccessTeamHub = Boolean(profile?.permissions.canAccessTeamHub)
  const [displayName, setDisplayName] = useState('')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.user.displayName ?? '')
  }, [profile?.user.displayName])

  const onProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setProfileError(null)
    setProfileSaved(false)
    try {
      await updateProfileMutation.mutateAsync({ displayName })
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save profile')
    }
  }

  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-animate-in p-6 sm:p-8">
        <p className="portal-eyebrow">Profile</p>
        <h3 className={`mt-2 text-lg text-app-heading ${bricolage_grot600.className}`}>
          Your profile
        </h3>
        <p className="mt-1 text-sm text-app-muted">
          Your photo appears in the header. You can also click your avatar there to update it.
        </p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <PortalUserAvatar size="md" showMenu />
          <form onSubmit={(e) => void onProfileSubmit(e)} className="min-w-0 flex-1 space-y-4">
            <div>
              <label htmlFor="portal-display-name" className="text-sm font-medium text-app-heading">
                Display name
              </label>
              <input
                id="portal-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile?.user.email ?? 'Your name'}
                className="portal-input mt-1.5 w-full"
              />
            </div>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="portal-btn-primary text-sm"
            >
              {updateProfileMutation.isPending ? 'Saving…' : 'Save profile'}
            </button>
            {profileSaved ? (
              <p className="text-sm text-green-700">Profile saved.</p>
            ) : null}
            {profileError ? (
              <p className="text-sm text-red-600" role="alert">
                {profileError}
              </p>
            ) : null}
          </form>
        </div>
      </section>
      {canManageTeam && profile?.organization ? (
        <OrganizationBrandingSection
          organizationName={profile.organization.name}
          logoUrl={profile.organization.logoUrl}
        />
      ) : null}
      {canAccessTeamHub ? (
        <section className="portal-glass-card portal-animate-in p-6 sm:p-8">
          <p className="portal-eyebrow">Team</p>
          <p className={`mt-2 text-sm text-app-muted`}>
            Manage organization members and project access from the dedicated Team workspace.
          </p>
          <Link
            href={`/?${CONTROL_CENTER_VIEW_QUERY}=team`}
            className="portal-btn-primary mt-4 inline-flex"
          >
            Open Team
          </Link>
        </section>
      ) : (
        <PortalTeamPanel canManage={canManageTeam} />
      )}
      <section className="portal-glass-card portal-animate-in p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-chambray/10 text-chambray dark:bg-white/10 dark:text-casablanca">
            <Settings className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-lg text-app-heading ${bricolage_grot600.className}`}>
              Settings
            </h3>
            <p className="mt-1 text-sm text-app-muted">
              Appearance and workspace preferences.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <ThemeToggle variant="settings" />
        </div>
      </section>
      {showPreviewBanner ? (
        <p className="text-center text-xs tracking-wide text-app-muted uppercase">
          Preview workspace · Live data coming soon
        </p>
      ) : null}
    </div>
  )
}
