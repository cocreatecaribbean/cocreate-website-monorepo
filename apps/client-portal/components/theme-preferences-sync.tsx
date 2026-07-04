'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'

export type ThemePreferenceValue = 'light' | 'dark' | 'system'

/**
 * Applies account-synced theme once after login.
 * Local next-themes / localStorage still paint first; server wins on hydrate.
 */
export default function ThemePreferencesSync({
  serverTheme,
}: {
  serverTheme?: ThemePreferenceValue | null
}) {
  const { setTheme } = useTheme()
  const hydratedFromServer = useRef(false)

  useEffect(() => {
    if (hydratedFromServer.current || !serverTheme) return
    hydratedFromServer.current = true
    setTheme(serverTheme)
  }, [serverTheme, setTheme])

  return null
}
