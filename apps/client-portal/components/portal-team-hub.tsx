'use client'

import { FormEvent, useState } from 'react'
import ProjectCover from '@/components/project-cover'
import ProjectTeamAside from '@/components/project-team-aside'
import {
  useInviteTeamMemberMutation,
  useRequestTeamInviteMutation,
  useUpdateTeamMemberMutation,
} from '@/lib/api/mutations/team'
import { useTeamHubQuery } from '@/lib/api/queries/team'
import {
  type ClientOrgRole,
  type ProjectTeamCard,
  type TeamMember,
} from '@/lib/team/fetch-team-client'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

const roleLabels: Record<ClientOrgRole, string> = {
  OWNER: 'Owner',
  PROJECT_MANAGER: 'Project manager',
  MEMBER: 'Member',
}

export default function PortalTeamHub() {
  const { data: hub = null, isLoading: loading, error: queryError } = useTeamHubQuery()
  const inviteMutation = useInviteTeamMemberMutation()
  const requestInviteMutation = useRequestTeamInviteMutation()
  const updateMemberMutation = useUpdateTeamMemberMutation()
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ClientOrgRole>('MEMBER')
  const [socialListening, setSocialListening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)


  const permissions = hub?.permissions

  const onInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!permissions?.canInviteImmediately || !email.trim()) return
    setSubmitting(true)
    setMessage(null)
    setDevSignInUrl(null)
    setError(null)
    try {
      const result = await inviteMutation.mutateAsync({
        email: email.trim(),
        clientOrgRole: role,
        canAccessSocialListening: socialListening,
      })
      setEmail('')
      setMessage(`Invitation sent to ${result.member.email}`)
      if (result.invitation?.devSignInUrl) {
        setDevSignInUrl(result.invitation.devSignInUrl)
      }
          } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setSubmitting(false)
    }
  }

  const onRequestInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!permissions?.canRequestInvite || !email.trim()) return
    setSubmitting(true)
    setMessage(null)
    setError(null)
    try {
      const result = await requestInviteMutation.mutateAsync({
        email: email.trim(),
        clientOrgRole: role,
      })
      setEmail('')
      setMessage(
        `Invite request submitted for ${result.request.email}. CoCreate will review and send the invitation.`,
      )
          } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleSocial = async (member: TeamMember) => {
    if (!permissions?.canToggleSocialListening || member.clientOrgRole === 'OWNER') return
    try {
      await updateMemberMutation.mutateAsync({
        userId: member.id,
        body: {
          canAccessSocialListening: !member.canAccessSocialListening,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const onRoleChange = async (member: TeamMember, clientOrgRole: ClientOrgRole) => {
    if (!permissions?.canManageOrgRoles || member.clientOrgRole === 'OWNER') return
    try {
      await updateMemberMutation.mutateAsync({
        userId: member.id,
        body: { clientOrgRole },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  if (loading) {
    return <p className="text-sm text-app-muted">Loading team workspace…</p>
  }

  if (!hub) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error ?? (queryError instanceof Error ? queryError.message : 'Unable to load team workspace')}
      </p>
    )
  }

  const isOwner = hub.viewerRole === 'OWNER'
  const members = hub.members

  return (
    <div className="space-y-8">
      <section className="portal-glass-card portal-animate-in p-6 sm:p-8">
        <p className="portal-eyebrow">Organization</p>
        <h3 className={`mt-1 text-lg text-app-heading ${bricolage_grot600.className}`}>
          Members
        </h3>
        <p className={`mt-2 text-sm text-app-muted ${bricolage_grot500.className}`}>
          {isOwner
            ? 'Invite and manage roles for your organization. Changes sync with your CoCreate account team.'
            : 'View teammates and request new invites for CoCreate to approve. Promote members to project manager when needed.'}
        </p>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="mt-4 text-sm text-chambray">{message}</p> : null}
        {devSignInUrl ? (
          <p className="mt-2 text-sm">
            <a href={devSignInUrl} className="text-sanmarino underline">
              Dev sign-in link
            </a>
          </p>
        ) : null}

        {permissions?.canInviteImmediately ? (
          <form onSubmit={onInvite} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="portal-input w-full"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ClientOrgRole)}
                className="portal-input text-sm"
              >
                <option value="PROJECT_MANAGER">Project manager</option>
                <option value="MEMBER">Member</option>
              </select>
              <label className="flex flex-col gap-1 text-sm text-app-muted sm:flex-row sm:items-center sm:gap-2">
                <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={socialListening}
                    onChange={(e) => setSocialListening(e.target.checked)}
                  />
                  Can view Social Listening
                </span>
                <span className="text-xs">
                  Only applies when your company has an active Social Listening subscription.
                </span>
              </label>
            </div>
            <button type="submit" disabled={submitting} className="portal-btn-primary">
              {submitting ? 'Sending…' : 'Invite teammate'}
            </button>
          </form>
        ) : null}

        {permissions?.canRequestInvite ? (
          <form onSubmit={onRequestInvite} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="portal-input w-full"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ClientOrgRole)}
              className="portal-input text-sm"
            >
              <option value="PROJECT_MANAGER">Project manager</option>
              <option value="MEMBER">Member</option>
            </select>
            <p className="text-xs text-app-muted">
              New invites are sent to CoCreate for approval before your teammate receives access.
            </p>
            <button type="submit" disabled={submitting} className="portal-btn-primary">
              {submitting ? 'Submitting…' : 'Request invite'}
            </button>
          </form>
        ) : null}

        {hub.pendingInviteRequests.length > 0 ? (
          <div className="mt-6">
            <p className={`text-sm text-app-primary ${bricolage_grot600.className}`}>
              Pending invite requests
            </p>
            <ul className="mt-2 space-y-2 text-sm text-app-muted">
              {hub.pendingInviteRequests.map((req) => (
                <li key={req.id}>
                  {req.email} as {roleLabels[req.requestedClientOrgRole]} — awaiting CoCreate
                  approval
                  {!isOwner ? null : (
                    <span className="text-app-muted"> (requested by {req.requestedByEmail})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <MembersTable
          members={members}
          canManageRoles={Boolean(permissions?.canManageOrgRoles)}
          canToggleSocial={Boolean(permissions?.canToggleSocialListening)}
          onRoleChange={onRoleChange}
          onToggleSocial={onToggleSocial}
        />
      </section>

      <ProjectSection
        title={isOwner ? 'All projects' : 'Your projects'}
        description={
          isOwner
            ? 'Manage who can access each project in your organization.'
            : 'Add teammates to projects you created.'
        }
        projects={hub.projectsOwned}
      />

      {!isOwner && hub.projectsShared.length > 0 ? (
        <ProjectSection
          title="Shared with you"
          description="Projects another project manager created and added you to."
          projects={hub.projectsShared}
        />
      ) : null}
    </div>
  )
}

function MembersTable({
  members,
  canManageRoles,
  canToggleSocial,
  onRoleChange,
  onToggleSocial,
}: {
  members: TeamMember[]
  canManageRoles: boolean
  canToggleSocial: boolean
  onRoleChange: (member: TeamMember, role: ClientOrgRole) => void
  onToggleSocial: (member: TeamMember) => void
}) {
  return (
    <>
      <ul className="mt-8 space-y-3 lg:hidden">
        {members.map((member) => (
          <li
            key={member.id}
            className="rounded-xl border border-chambray/10 p-4 dark:border-white/10"
          >
            <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>{member.email}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-app-muted">Role</dt>
                <dd>
                  {canManageRoles && member.clientOrgRole !== 'OWNER' ? (
                    <select
                      value={member.clientOrgRole ?? 'MEMBER'}
                      onChange={(e) => onRoleChange(member, e.target.value as ClientOrgRole)}
                      className="portal-input rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="PROJECT_MANAGER">Project manager</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  ) : (
                    roleLabels[member.clientOrgRole ?? 'MEMBER']
                  )}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-app-muted">Status</dt>
                <dd className="capitalize">{member.status.toLowerCase()}</dd>
              </div>
              {canToggleSocial ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-app-muted">Social Listening</dt>
                  <dd>
                    {member.clientOrgRole === 'OWNER' ? (
                      'Included with subscription'
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleSocial(member)}
                        className="min-h-10 text-sanmarino underline"
                      >
                        {member.canAccessSocialListening ? 'On' : 'Off'}
                      </button>
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
      <div className="mt-8 hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-app-muted dark:border-white/10">
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {canToggleSocial ? (
              <th className="py-2 font-medium">Can view Social Listening</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3 pr-4">{member.email}</td>
              <td className="py-3 pr-4">
                {canManageRoles && member.clientOrgRole !== 'OWNER' ? (
                  <select
                    value={member.clientOrgRole ?? 'MEMBER'}
                    onChange={(e) => onRoleChange(member, e.target.value as ClientOrgRole)}
                    className="portal-input rounded-lg px-2 py-1 text-sm"
                  >
                    <option value="PROJECT_MANAGER">Project manager</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  roleLabels[member.clientOrgRole ?? 'MEMBER']
                )}
              </td>
              <td className="py-3 pr-4 capitalize">{member.status.toLowerCase()}</td>
              {canToggleSocial ? (
                <td className="py-3">
                  {member.clientOrgRole === 'OWNER' ? (
                    'Included with subscription'
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleSocial(member)}
                      className="text-sanmarino underline"
                    >
                      {member.canAccessSocialListening ? 'On' : 'Off'}
                    </button>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

function ProjectSection({
  title,
  description,
  projects,
}: {
  title: string
  description: string
  projects: ProjectTeamCard[]
}) {
  if (projects.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <p className="portal-eyebrow">Projects</p>
        <h3 className={`mt-1 text-lg text-app-heading ${bricolage_grot600.className}`}>{title}</h3>
        <p className={`mt-2 text-sm text-app-muted ${bricolage_grot500.className}`}>{description}</p>
      </div>
      {projects.map((project) => (
        <article
          key={project.id}
          className="portal-glass-card grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_280px] sm:items-start sm:p-8"
        >
          <div className="min-w-0">
            <ProjectCover
              coverImageUrl={project.coverImageUrl}
              alt={project.title}
              variant="hero"
              className="mb-4"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className={`text-base text-chambray ${bricolage_grot600.className}`}>
                {project.title}
              </h4>
              <p className="text-xs text-app-muted capitalize">
                {project.status.toLowerCase().replace('_', ' ')} ·{' '}
                {project.phase.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            {project.creatorEmail ? (
              <p className="mt-1 text-xs text-app-muted">Created by {project.creatorEmail}</p>
            ) : null}
          </div>
          <ProjectTeamAside
            projectId={project.id}
            className="border border-chambray/8 bg-chambray/[0.02] shadow-none dark:border-white/8 dark:bg-white/[0.03]"
          />
        </article>
      ))}
    </section>
  )
}
