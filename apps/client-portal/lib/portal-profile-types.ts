export type {
  ClientOrgRole,
  PortalPermissions,
  PortalProfile,
  PortalProfileOrganization,
  PortalProfilePayload,
  PortalProfileResponse,
  PortalProfileUser,
} from '@cocreate/api-contracts/v1/client-portal'

/** Mirrors API `canViewSocialListening` / `canUseSocialListening` when permissions are absent. */
export function resolveCanUseSocialListening(profile: {
  user: Pick<
    import('@cocreate/api-contracts/v1/client-portal').PortalProfileUser,
    'clientOrgRole' | 'canAccessSocialListening'
  >
  organization: Pick<
    import('@cocreate/api-contracts/v1/client-portal').PortalProfileOrganization,
    'isSocialListeningSubscriber'
  > | null
  permissions?: Pick<
    import('@cocreate/api-contracts/v1/client-portal').PortalPermissions,
    'canUseSocialListening' | 'canViewSocialListening'
  >
}): boolean {
  if (profile.permissions?.canViewSocialListening !== undefined) {
    return profile.permissions.canViewSocialListening
  }
  if (profile.permissions?.canUseSocialListening !== undefined) {
    return profile.permissions.canUseSocialListening
  }
  const orgSubscribed = Boolean(profile.organization?.isSocialListeningSubscriber)
  if (!orgSubscribed) return false
  const role = profile.user.clientOrgRole
  if (role === 'ADMIN' || role === 'SOCIAL_ANALYST') return true
  if (role === 'CONTRIBUTOR') return Boolean(profile.user.canAccessSocialListening)
  return false
}
