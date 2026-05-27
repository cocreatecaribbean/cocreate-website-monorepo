'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/theme-toggle'
import PortalTeamPanel from '@/components/portal-team-panel'
import { fetchPortalProfile } from '@/lib/team/fetch-team-client'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import { bricolage_grot600 } from '@/styles/fonts'
import { Settings } from 'lucide-react'

type PortalSettingsPanelProps = {
  showPreviewBanner?: boolean
}

export default function PortalSettingsPanel({
  showPreviewBanner = false,
}: PortalSettingsPanelProps) {
  const [canManageTeam, setCanManageTeam] = useState(false)
  const [canAccessTeamHub, setCanAccessTeamHub] = useState(false)

  useEffect(() => {
    void fetchPortalProfile().then((profile) => {
      setCanManageTeam(Boolean(profile?.permissions.canManageOrgTeam))
      setCanAccessTeamHub(Boolean(profile?.permissions.canAccessTeamHub))
    })
  }, [])

  return (
    <div className="space-y-6">
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
        <div className="mt-8 max-w-md">
          <ThemeToggle variant="settings" />
        </div>
      </section>
      {showPreviewBanner ? (
        <p className="flex items-center justify-center gap-2 text-center text-xs tracking-wide text-app-muted uppercase">
          Preview workspace · Live data coming soon
        </p>
      ) : null}
    </div>
  )
}
