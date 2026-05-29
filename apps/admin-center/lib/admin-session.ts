export type AdminPortalRole = 'SUPER_ADMIN' | 'ADMIN' | 'COLLABORATOR' | 'api_key'

export function isSuperAdminSession(role: AdminPortalRole | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'api_key'
}

export function isCoreTeamSession(role: AdminPortalRole | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'api_key'
}

export function isCollaboratorSession(role: AdminPortalRole | null | undefined): boolean {
  return role === 'COLLABORATOR'
}

export function adminRoleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super admin'
    case 'ADMIN':
      return 'Admin'
    case 'COLLABORATOR':
      return 'Collaborator'
    default:
      return role
  }
}
