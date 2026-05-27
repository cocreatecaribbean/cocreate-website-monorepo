'use client'

import { useEffect, useState } from 'react'
import { fetchPortalProfile } from '@/lib/team/fetch-team-client'

export function usePortalPermissions() {
  const [canAccessTeamHub, setCanAccessTeamHub] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void fetchPortalProfile().then((profile) => {
      setCanAccessTeamHub(Boolean(profile?.permissions.canAccessTeamHub))
      setLoaded(true)
    })
  }, [])

  return { canAccessTeamHub, loaded }
}
