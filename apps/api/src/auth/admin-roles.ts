import { UserRole } from '@cocreate/database'

/** Agency staff (super admin or standard admin). */
export function isAgencyAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
}

export function isCollaboratorRole(role: UserRole): boolean {
  return role === UserRole.COLLABORATOR
}

/** Any user who signs into Admin Center (core team or project collaborator). */
export function isAgencyStaffRole(role: UserRole): boolean {
  return isAgencyAdminRole(role) || isCollaboratorRole(role)
}

export function isSuperAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN
}
