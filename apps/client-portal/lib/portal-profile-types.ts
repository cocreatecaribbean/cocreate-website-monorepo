export type ClientOrgRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER'

export type PortalPermissions = {
  canManageOrgTeam: boolean
  canAccessTeamHub: boolean
  canManageOrgRoles: boolean
  canInviteOrgMemberImmediately: boolean
  canRequestOrgInvite: boolean
  canToggleSocialListeningForTeam: boolean
  canCreateProject: boolean
  canUseSocialListening: boolean
}

export type PortalProfileUser = {
  id: string
  email: string
  status: string
  role: string
  clientOrgRole: ClientOrgRole | null
  canAccessSocialListening: boolean
}

export type PortalProfileOrganization = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isSocialListeningSubscriber: boolean
}

export type PortalProfilePayload = {
  user: PortalProfileUser
  organization: PortalProfileOrganization | null
  permissions: PortalPermissions
}

/** Mirrors API `canUseSocialListening` when permissions are absent (e.g. stale shape). */
export function resolveCanUseSocialListening(profile: {
  user: Pick<PortalProfileUser, 'clientOrgRole' | 'canAccessSocialListening'>
  organization: Pick<PortalProfileOrganization, 'isSocialListeningSubscriber'> | null
  permissions?: Pick<PortalPermissions, 'canUseSocialListening'>
}): boolean {
  if (profile.permissions?.canUseSocialListening !== undefined) {
    return profile.permissions.canUseSocialListening
  }
  const orgSubscribed = Boolean(profile.organization?.isSocialListeningSubscriber)
  if (!orgSubscribed) return false
  if (profile.user.clientOrgRole === 'OWNER') return true
  return profile.user.canAccessSocialListening
}
