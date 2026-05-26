import type { LucideIcon } from 'lucide-react'
import { Settings } from 'lucide-react'

/** Global client portal settings — shown in Control Center and Social Listening sidebars. */
export const PORTAL_SETTINGS = {
  id: 'settings' as const,
  label: 'Settings',
  description: 'Appearance and portal preferences',
  icon: Settings,
}

export type PortalSettingsNavItem = {
  id: typeof PORTAL_SETTINGS.id
  label: string
  description: string
  icon: LucideIcon
}

export const PORTAL_SETTINGS_QUERY = 'ccView'

export function isPortalSettingsView(value: string | null): boolean {
  return value === PORTAL_SETTINGS.id
}
