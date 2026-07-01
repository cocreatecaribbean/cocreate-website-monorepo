export type {
  ClientOrgRole,
  PortalPermissions,
  PortalProfile,
  PortalProfileOrganization,
  PortalProfilePayload,
  PortalProfileResponse,
  PortalProfileUser,
} from '@cocreate/api-contracts/v1/client-portal'

/** Mirrors API `canUseSocialListening` when permissions are absent (e.g. stale shape). */
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
    'canUseSocialListening'
  >
}): boolean {
  if (profile.permissions?.canUseSocialListening !== undefined) {
    return profile.permissions.canUseSocialListening
  }
  const orgSubscribed = Boolean(profile.organization?.isSocialListeningSubscriber)
  if (!orgSubscribed) return false
  if (profile.user.clientOrgRole === 'OWNER') return true
  return profile.user.canAccessSocialListening
}
