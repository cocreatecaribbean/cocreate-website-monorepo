'use client'
import { nestApiUrl } from '@cocreate/api-client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'


import type {
  ClientOrgRole,
  PortalPermissions,
  PortalProfileOrganization,
  PortalProfileUser,
} from '@/lib/portal-profile-types'

export type { ClientOrgRole }
export type ClientProjectAccessLevel = 'MANAGE' | 'VIEW'

export type TeamMember = {
  id: string
  email: string
  status: string
  clientOrgRole: ClientOrgRole | null
  canAccessSocialListening: boolean
  createdAt: string
  updatedAt: string
}

export type ProjectMember = {
  id: string
  userId: string
  email: string
  clientOrgRole: ClientOrgRole | null
  access: ClientProjectAccessLevel
  grantedByUserId: string
  createdAt: string
}

export type AssignableProjectMember = {
  userId: string
  email: string
  clientOrgRole: ClientOrgRole | null
}

export type { PortalPermissions }

export type TeamHubPermissions = {
  canManageOrgRoles: boolean
  canInviteImmediately: boolean
  canRequestInvite: boolean
  canToggleSocialListening: boolean
}

export type ProjectTeamCard = {
  id: string
  title: string
  status: string
  phase: string
  creatorUserId: string
  creatorEmail: string
  coverImageUrl?: string | null
  canManage: boolean
  members: ProjectMember[]
}

export type TeamInviteRequest = {
  id: string
  email: string
  requestedClientOrgRole: ClientOrgRole
  status: string
  requestedByEmail: string
  createdAt: string
  rejectionReason?: string | null
}

export type TeamHub = {
  ok: true
  viewerRole: ClientOrgRole | null
  permissions: TeamHubPermissions
  members: TeamMember[]
  projectsOwned: ProjectTeamCard[]
  projectsShared: ProjectTeamCard[]
  pendingInviteRequests: TeamInviteRequest[]
}

export type PortalProfile = {
  user: PortalProfileUser
  organization: PortalProfileOrganization | null
  permissions: PortalPermissions
}

async function getToken() {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function teamFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  if (!token) throw new Error('Not signed in')

  const response = await fetch(nestApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })

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
    const data = await teamFetch<PortalProfile & { ok?: boolean }>('/client-portal/me')
    return data
  } catch {
    return null
  }
}

export async function fetchOrgTeam() {
  return teamFetch<{
    ok: true
    members: TeamMember[]
    canManage: boolean
    permissions?: TeamHubPermissions
  }>('/client-portal/team')
}

export async function fetchTeamHub() {
  return teamFetch<TeamHub>('/client-portal/team/hub')
}

export async function requestTeamInvite(body: {
  email: string
  clientOrgRole: ClientOrgRole
}) {
  return teamFetch<{ ok: true; request: TeamInviteRequest }>(
    '/client-portal/team/invite-requests',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export async function inviteTeamMember(body: {
  email: string
  clientOrgRole: ClientOrgRole
  canAccessSocialListening?: boolean
}) {
  return teamFetch<{ ok: true; member: TeamMember; invitation?: { devSignInUrl?: string } }>(
    '/client-portal/team/invite',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export async function updateTeamMember(
  userId: string,
  body: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean },
) {
  return teamFetch<{ ok: true; member: TeamMember }>(`/client-portal/team/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function fetchProjectMembers(projectId: string) {
  return teamFetch<{
    ok: true
    projectId: string
    creator: { userId: string; email: string; implicitAccess: 'MANAGE' }
    members: ProjectMember[]
    assignableMembers: AssignableProjectMember[]
    canManage: boolean
  }>(`/client-portal/projects/${projectId}/members`)
}

export async function addProjectMember(
  projectId: string,
  body: { email: string; access: ClientProjectAccessLevel },
) {
  return teamFetch<{ ok: true; member: ProjectMember }>(
    `/client-portal/projects/${projectId}/members`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export async function removeProjectMember(projectId: string, userId: string) {
  return teamFetch<{ ok: true }>(
    `/client-portal/projects/${projectId}/members/${userId}`,
    { method: 'DELETE' },
  )
}
