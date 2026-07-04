import { nestApiUrl } from '@cocreate/api-client'
import { PortalProfileResponseSchema } from '@cocreate/api-contracts/v1/client-portal'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { getAccessToken } from '@/lib/supabase/server'
import {
  resolveCanUseSocialListening,
  type ClientOrgRole,
  type PortalPermissions,
  type PortalProfilePayload,
} from '@/lib/portal-profile-types'

export type { ClientOrgRole, PortalPermissions }

export type ClientPortalProfile = PortalProfilePayload

export async function fetchClientPortalProfile(): Promise<ClientPortalProfile | null> {
  const token = await getAccessToken()
  if (!token) return null

  let response: Response
  try {
    response = await fetch(nestApiUrl('/client-portal/me'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return null
  }

  if (!response.ok) return null

  const data = await response.json().catch(() => null)
  const parsed = parseApiResponseSafe(PortalProfileResponseSchema, data)
  if (!parsed) return null

  return {
    user: parsed.user,
    organization: parsed.organization,
    permissions: parsed.permissions,
    preferences: parsed.preferences,
  }
}

export { resolveCanUseSocialListening }
