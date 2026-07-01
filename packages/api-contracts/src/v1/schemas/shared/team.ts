import { z } from 'zod'
import { isoDateTimeString } from '../../../zod/common'
import {
  ClientOrgRoleSchema,
  ClientProjectAccessLevelSchema,
} from '../../../zod/enums'
import {
  ClientProjectPhaseSchema,
  ClientProjectStatusSchema,
} from './projects'

export const ClientTeamMemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.string(),
  clientOrgRole: ClientOrgRoleSchema.nullable(),
  canAccessSocialListening: z.boolean(),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
})
export type ClientTeamMember = z.infer<typeof ClientTeamMemberSchema>

export const ProjectMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string(),
  clientOrgRole: ClientOrgRoleSchema.nullable(),
  access: ClientProjectAccessLevelSchema,
  grantedByUserId: z.string(),
  createdAt: isoDateTimeString,
})
export type ProjectMember = z.infer<typeof ProjectMemberSchema>

export const AssignableProjectMemberSchema = z.object({
  userId: z.string(),
  email: z.string(),
  clientOrgRole: ClientOrgRoleSchema.nullable(),
})
export type AssignableProjectMember = z.infer<typeof AssignableProjectMemberSchema>

export const ProjectTeamCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: ClientProjectStatusSchema,
  phase: ClientProjectPhaseSchema,
  creatorUserId: z.string(),
  creatorEmail: z.string(),
  coverImageUrl: z.string().nullable().optional(),
  canManage: z.boolean(),
  members: z.array(ProjectMemberSchema),
})
export type ProjectTeamCard = z.infer<typeof ProjectTeamCardSchema>

export const TeamHubPermissionsSchema = z.object({
  canManageOrgRoles: z.boolean(),
  canInviteImmediately: z.boolean(),
  canRequestInvite: z.boolean(),
  canToggleSocialListening: z.boolean(),
})
export type TeamHubPermissions = z.infer<typeof TeamHubPermissionsSchema>

export const TeamInviteRequestSchema = z.object({
  id: z.string(),
  email: z.string(),
  requestedClientOrgRole: ClientOrgRoleSchema,
  status: z.string(),
  requestedByEmail: z.string(),
  createdAt: isoDateTimeString,
  rejectionReason: z.string().nullable().optional(),
})
export type TeamInviteRequest = z.infer<typeof TeamInviteRequestSchema>

export const OrgTeamListResponseSchema = z.object({
  ok: z.literal(true),
  members: z.array(ClientTeamMemberSchema),
  canManage: z.boolean(),
  permissions: TeamHubPermissionsSchema.optional(),
})
export type OrgTeamListResponse = z.infer<typeof OrgTeamListResponseSchema>

export const TeamHubResponseSchema = z.object({
  ok: z.literal(true),
  viewerRole: ClientOrgRoleSchema.nullable(),
  permissions: TeamHubPermissionsSchema,
  members: z.array(ClientTeamMemberSchema),
  projectsOwned: z.array(ProjectTeamCardSchema),
  projectsShared: z.array(ProjectTeamCardSchema),
  pendingInviteRequests: z.array(TeamInviteRequestSchema),
})
export type TeamHubResponse = z.infer<typeof TeamHubResponseSchema>

export const ProjectMembersCreatorSchema = z.object({
  userId: z.string(),
  email: z.string(),
  implicitAccess: z.literal('MANAGE'),
})

export const ProjectMembersResponseSchema = z.object({
  ok: z.literal(true),
  projectId: z.string(),
  creator: ProjectMembersCreatorSchema,
  members: z.array(ProjectMemberSchema),
  canManage: z.boolean(),
  assignableMembers: z.array(AssignableProjectMemberSchema).optional(),
})
export type ProjectMembersResponse = z.infer<typeof ProjectMembersResponseSchema>

export const TeamMemberMutationResponseSchema = z.object({
  ok: z.literal(true),
  member: ClientTeamMemberSchema,
})
export type TeamMemberMutationResponse = z.infer<typeof TeamMemberMutationResponseSchema>

export const ProjectMemberMutationResponseSchema = z.object({
  ok: z.literal(true),
  member: ProjectMemberSchema,
})
export type ProjectMemberMutationResponse = z.infer<typeof ProjectMemberMutationResponseSchema>

export const TeamInviteRequestMutationResponseSchema = z.object({
  ok: z.literal(true),
  request: TeamInviteRequestSchema,
})
export type TeamInviteRequestMutationResponse = z.infer<
  typeof TeamInviteRequestMutationResponseSchema
>

export const TeamInviteMemberResponseSchema = z.object({
  ok: z.literal(true),
  member: ClientTeamMemberSchema,
  invitation: z
    .object({
      provider: z.literal('supabase-auth').optional(),
      status: z.string().optional(),
      invitationId: z.string().optional(),
      devSignInUrl: z.string().optional(),
    })
    .optional(),
})
export type TeamInviteMemberResponse = z.infer<typeof TeamInviteMemberResponseSchema>
