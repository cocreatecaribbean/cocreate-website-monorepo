import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type {
  CreateProjectForAdminPayload,
  CreateProjectForAdminResult,
  OrganizationPortalStatus,
} from '@/lib/projects/api-types'

export type {
  CreateProjectForAdminPayload,
  CreateProjectForAdminResult,
  OrganizationPortalStatus,
  OrganizationPortalUser,
  PortalUserStatus,
} from '@/lib/projects/api-types'

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
