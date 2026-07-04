'use client'
import { nestApiUrl } from '@cocreate/api-client'
import { z } from 'zod'
import {
  OrgTeamListResponseSchema,
  PortalProfileResponseSchema,
  ProjectMemberMutationResponseSchema,
  ProjectMembersResponseSchema,
  TeamHubResponseSchema,
  TeamInviteMemberResponseSchema,
  TeamInviteRequestMutationResponseSchema,
  TeamMemberMutationResponseSchema,
  type AssignableProjectMember,
  type ClientOrgRole,
  type ClientProjectAccessLevel,
  type OrgTeamListResponse,
  type PortalPermissions,
  type PortalProfile,
  type PortalProfileOrganization,
  type PortalProfileUser,
  type ProjectMember,
  type ProjectMemberMutationResponse,
  type ProjectMembersResponse,
  type ProjectTeamCard,
  type TeamHub,
  type TeamHubPermissions,
  type TeamInviteMemberResponse,
  type TeamInviteRequest,
  type TeamInviteRequestMutationResponse,
  type TeamMember,
  type TeamMemberMutationResponse,
} from '@cocreate/api-contracts/v1/client-portal'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'

function parseTeamMutationResponse<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
  message = 'Invalid server response',
): z.infer<S> {
  const parsed = parseApiResponseSafe(schema, data)
  if (!parsed) throw new Error(message)
  return parsed
}

export type {
  AssignableProjectMember,
  ClientOrgRole,
  ClientProjectAccessLevel,
  OrgTeamListResponse,
  PortalPermissions,
  PortalProfile,
  PortalProfileOrganization,
  PortalProfileUser,
  ProjectMember,
  ProjectMemberMutationResponse,
  ProjectMembersResponse,
  ProjectTeamCard,
  TeamHub,
  TeamHubPermissions,
  TeamInviteMemberResponse,
  TeamInviteRequest,
  TeamInviteRequestMutationResponse,
  TeamMember,
  TeamMemberMutationResponse,
}

async function getToken() {
  return getPortalAccessToken()
}

async function teamFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  if (!token) throw new Error('Not signed in')

  let response: Response
  try {
    response = await fetch(nestApiUrl(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    })
  } catch {
    throw new Error(
      'Could not reach the API. Ensure apps/api is running on port 3001.',
    )
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string }).message)
        : `Request failed (${response.status})`,
    )
  }
  return data as T
}

export async function fetchPortalProfile(): Promise<PortalProfile | null> {
  try {
    const data = await teamFetch<unknown>('/client-portal/me')
    const parsed = parseApiResponseSafe(PortalProfileResponseSchema, data)
    if (!parsed) return null
    return {
      user: parsed.user,
      organization: parsed.organization,
      permissions: parsed.permissions,
      preferences: parsed.preferences,
    }
  } catch {
    return null
  }
}

export async function patchPortalPreferences(input: {
  theme: 'light' | 'dark' | 'system'
}): Promise<{ ok: boolean; theme?: string; message?: string }> {
  try {
    const data = await teamFetch<{ ok?: boolean; theme?: string; message?: string }>(
      '/client-portal/preferences',
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    )
    return data.ok ? { ok: true, theme: data.theme } : { ok: false, message: data.message }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not save preferences',
    }
  }
}

export async function fetchOrgTeam(): Promise<OrgTeamListResponse | null> {
  const data = await teamFetch<unknown>('/client-portal/team')
  return parseApiResponseSafe(OrgTeamListResponseSchema, data)
}

export async function fetchTeamHub(): Promise<TeamHub | null> {
  const data = await teamFetch<unknown>('/client-portal/team/hub')
  return parseApiResponseSafe(TeamHubResponseSchema, data)
}

export async function requestTeamInvite(body: {
  email: string
  clientOrgRole: ClientOrgRole
}): Promise<TeamInviteRequestMutationResponse> {
  const data = await teamFetch<unknown>('/client-portal/team/invite-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseTeamMutationResponse(TeamInviteRequestMutationResponseSchema, data)
}

export async function inviteTeamMember(body: {
  email: string
  clientOrgRole: ClientOrgRole
  canAccessSocialListening?: boolean
}): Promise<TeamInviteMemberResponse> {
  const data = await teamFetch<unknown>('/client-portal/team/invite', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseTeamMutationResponse(TeamInviteMemberResponseSchema, data)
}

export async function updateTeamMember(
  userId: string,
  body: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean },
): Promise<TeamMemberMutationResponse> {
  const data = await teamFetch<unknown>(`/client-portal/team/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return parseTeamMutationResponse(TeamMemberMutationResponseSchema, data)
}

export async function fetchProjectMembers(
  projectId: string,
): Promise<ProjectMembersResponse | null> {
  const data = await teamFetch<unknown>(`/client-portal/projects/${projectId}/members`)
  return parseApiResponseSafe(ProjectMembersResponseSchema, data)
}

export async function addProjectMember(
  projectId: string,
  body: { email: string; access: ClientProjectAccessLevel },
): Promise<ProjectMemberMutationResponse> {
  const data = await teamFetch<unknown>(`/client-portal/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseTeamMutationResponse(ProjectMemberMutationResponseSchema, data)
}

export async function removeProjectMember(projectId: string, userId: string) {
  await teamFetch<unknown>(`/client-portal/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })
}
