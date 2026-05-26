export type AdminPortalRole = 'SUPER_ADMIN' | 'ADMIN' | 'api_key'

export function isSuperAdminSession(role: AdminPortalRole | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'api_key'
}

export function adminRoleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super admin'
    case 'ADMIN':
      return 'Admin'
    default:
      return role
  }
}
