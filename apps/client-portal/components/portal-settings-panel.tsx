'use client'

import ThemeToggle from '@/components/theme-toggle'
import { bricolage_grot600 } from '@/styles/fonts'
import { Settings } from 'lucide-react'

type PortalSettingsPanelProps = {
  showPreviewBanner?: boolean
}

export default function PortalSettingsPanel({
  showPreviewBanner = false,
}: PortalSettingsPanelProps) {
  return (
    <div className="space-y-6">
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
              Appearance and workspace preferences. More notification and team options coming
              soon.
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
