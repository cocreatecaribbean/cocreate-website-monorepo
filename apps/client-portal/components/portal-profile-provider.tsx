'use client'

import { createContext, useContext } from 'react'
import ThemePreferencesSync from '@/components/theme-preferences-sync'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import type { PortalProfile } from '@/lib/team/fetch-team-client'

const PortalProfileSeedContext = createContext<PortalProfile | null>(null)

function PortalThemePreferencesSync() {
  const { data: profile } = usePortalProfileQuery()
  return <ThemePreferencesSync serverTheme={profile?.preferences?.theme} />
}

export function PortalProfileProvider({
  profile,
  children,
}: {
  profile: PortalProfile | null
  children: React.ReactNode
}) {
  return (
    <PortalProfileSeedContext.Provider value={profile}>
      <PortalThemePreferencesSync />
      {children}
    </PortalProfileSeedContext.Provider>
  )
}

export function usePortalProfileSeed() {
  return useContext(PortalProfileSeedContext)
}
