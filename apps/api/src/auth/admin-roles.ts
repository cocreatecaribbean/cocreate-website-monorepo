import { UserRole } from '@cocreate/database'

/** Agency staff (super admin or standard admin). */
export function isAgencyAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
}

export function isSuperAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN
}
