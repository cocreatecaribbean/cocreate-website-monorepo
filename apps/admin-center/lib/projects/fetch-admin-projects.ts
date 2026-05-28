import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type { ClientProjectSummary } from '@/lib/projects/types'

export type PortalUserStatus = 'ACTIVE' | 'INVITED'

export type OrganizationPortalUser = {
  id: string
  email: string
  status: PortalUserStatus
  clientOrgRole: string | null
}

export type OrganizationPortalStatus = {
  hasActiveUsers: boolean
  hasPortalUsers: boolean
  needsInvite: boolean
  activeUserCount: number
  invitedUsers: { id: string; email: string }[]
  suggestedContactEmail: string | null
  portalUsers: OrganizationPortalUser[]
}

export type CreateProjectForAdminPayload = {
  title: string
  description: string
  recipientUserIds?: string[]
  inviteEmails?: string[]
  /** @deprecated Use inviteEmails */
  contactEmail?: string
}

export type CreateProjectForAdminResult = {
  project: ClientProjectSummary
  portalActions: {
    notifiedActiveCount: number
    inviteRemindersSent: number
    newInvitesSent: number
    invitedEmails: string[]
  }
}

export async function fetchOrganizationPortalStatus(
  organizationId: string,
): Promise<OrganizationPortalStatus> {
  return fetchAdminBff<OrganizationPortalStatus>(
    `/api/clients/${organizationId}/portal-status`,
  )
}

export async function createProjectForAdmin(
  organizationId: string,
  payload: CreateProjectForAdminPayload,
): Promise<CreateProjectForAdminResult> {
  return fetchAdminBff<CreateProjectForAdminResult>(
    `/api/clients/${organizationId}/projects`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}
