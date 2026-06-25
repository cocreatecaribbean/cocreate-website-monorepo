import { nestApiUrl } from '@cocreate/api-client'
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

  const data = (await response.json()) as ClientPortalProfile & { ok?: boolean }
  if (!data.user) return null

  return {
    user: data.user,
    organization: data.organization ?? null,
    permissions: data.permissions ?? {
      canManageOrgTeam: false,
      canAccessTeamHub: false,
      canManageOrgRoles: false,
      canInviteOrgMemberImmediately: false,
      canRequestOrgInvite: false,
      canToggleSocialListeningForTeam: false,
      canCreateProject: false,
      canUseSocialListening: resolveCanUseSocialListening({
        user: data.user,
        organization: data.organization ?? null,
      }),
    },
  }
}

export { resolveCanUseSocialListening }
