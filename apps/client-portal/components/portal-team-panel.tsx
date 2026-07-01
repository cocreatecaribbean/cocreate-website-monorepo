'use client'

import { FormEvent, useState } from 'react'
import {
  useInviteTeamMemberMutation,
  useUpdateTeamMemberMutation,
} from '@/lib/api/mutations/team'
import { useOrgTeamQuery } from '@/lib/api/queries/team'
import {
  type ClientOrgRole,
  type TeamMember,
} from '@/lib/team/fetch-team-client'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

const roleLabels: Record<ClientOrgRole, string> = {
  OWNER: 'Owner',
  PROJECT_MANAGER: 'Project manager',
  MEMBER: 'Member',
}

export default function PortalTeamPanel({ canManage }: { canManage: boolean }) {
  const { data: orgTeam, isLoading: loading, error: queryError } = useOrgTeamQuery()
  const members = orgTeam?.members ?? []
  const inviteMutation = useInviteTeamMemberMutation()
  const updateMemberMutation = useUpdateTeamMemberMutation()
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ClientOrgRole>('MEMBER')
  const [socialListening, setSocialListening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)


  const onInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !email.trim()) return
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

  const onToggleSocial = async (member: TeamMember) => {
    if (!canManage || member.clientOrgRole === 'OWNER') return
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
    if (!canManage || member.clientOrgRole === 'OWNER') return
    try {
      await updateMemberMutation.mutateAsync({
        userId: member.id,
        body: { clientOrgRole },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <section className="portal-glass-card portal-animate-in p-6 sm:p-8">
      <p className="portal-eyebrow">Team</p>
      <h3 className={`mt-1 text-lg text-app-heading ${bricolage_grot600.className}`}>
        Organization members
      </h3>
      <p className={`mt-2 text-sm text-app-muted ${bricolage_grot500.className}`}>
        Owners invite project managers and members. Project managers control who can access each
        project they create.
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

      {canManage ? (
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

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-app-muted">Loading team…</p>
        ) : (
          <>
            <ul className="space-y-3 lg:hidden">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="rounded-xl border border-chambray/10 p-4 dark:border-white/10"
                >
                  <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                    {member.email}
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-app-muted">Role</dt>
                      <dd>
                        {canManage && member.clientOrgRole !== 'OWNER' ? (
                          <select
                            value={member.clientOrgRole ?? 'MEMBER'}
                            onChange={(e) =>
                              onRoleChange(member, e.target.value as ClientOrgRole)
                            }
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-app-muted">Social Listening</dt>
                      <dd>
                        {member.clientOrgRole === 'OWNER' ? (
                          'Included with subscription'
                        ) : canManage ? (
                          <button
                            type="button"
                            onClick={() => onToggleSocial(member)}
                            className="min-h-10 text-sanmarino underline"
                          >
                            {member.canAccessSocialListening ? 'On' : 'Off'}
                          </button>
                        ) : member.canAccessSocialListening ? (
                          'Yes'
                        ) : (
                          'No'
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-app-muted dark:border-white/10">
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Can view Social Listening</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-black/5 dark:border-white/5"
                >
                  <td className="py-3 pr-4">{member.email}</td>
                  <td className="py-3 pr-4">
                    {canManage && member.clientOrgRole !== 'OWNER' ? (
                      <select
                        value={member.clientOrgRole ?? 'MEMBER'}
                        onChange={(e) =>
                          onRoleChange(member, e.target.value as ClientOrgRole)
                        }
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
                  <td className="py-3">
                    {member.clientOrgRole === 'OWNER' ? (
                      'Included with subscription'
                    ) : canManage ? (
                      <button
                        type="button"
                        onClick={() => onToggleSocial(member)}
                        className="text-sanmarino underline"
                      >
                        {member.canAccessSocialListening ? 'On' : 'Off'}
                      </button>
                    ) : member.canAccessSocialListening ? (
                      'Yes'
                    ) : (
                      'No'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
