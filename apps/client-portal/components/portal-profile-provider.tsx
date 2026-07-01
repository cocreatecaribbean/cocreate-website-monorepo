'use client'

import { createContext, useContext } from 'react'
import type { PortalProfile } from '@/lib/team/fetch-team-client'

const PortalProfileSeedContext = createContext<PortalProfile | null>(null)

export function PortalProfileProvider({
  profile,
  children,
}: {
  profile: PortalProfile | null
  children: React.ReactNode
}) {
  return (
    <PortalProfileSeedContext.Provider value={profile}>
      {children}
    </PortalProfileSeedContext.Provider>
  )
}

export function usePortalProfileSeed() {
  return useContext(PortalProfileSeedContext)
}
