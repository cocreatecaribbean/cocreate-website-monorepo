'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'

type ClientOrgRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER'

type TeamMember = {
  id: string
  email: string
  status: string
  clientOrgRole: ClientOrgRole | null
  canAccessSocialListening: boolean
}

const roleLabels: Record<ClientOrgRole, string> = {
  OWNER: 'Owner',
  PROJECT_MANAGER: 'Project manager',
  MEMBER: 'Member',
}

type InviteRequest = {
  id: string
  email: string
  requestedClientOrgRole: ClientOrgRole
  status: string
  requestedByEmail: string
  createdAt: string
}

export default function ClientTeamPanel({
  organizationId,
  embedded = false,
  highlightInviteRequestId = null,
}: {
  organizationId: string
  /** When nested inside another card (e.g. Clients roster), avoid overflow traps */
  embedded?: boolean
  highlightInviteRequestId?: string | null
}) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteRequests, setInviteRequests] = useState<InviteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingRequestId, setActingRequestId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ClientOrgRole>('MEMBER')
  const [socialListening, setSocialListening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamData, requestsData] = await Promise.all([
        fetchAdminBff<{ members: TeamMember[] }>(`/api/clients/${organizationId}/team`),
        fetchAdminBff<{ requests: InviteRequest[] }>(
          `/api/clients/${organizationId}/team/invite-requests?status=PENDING`,
        ).catch(() => ({ requests: [] as InviteRequest[] })),
      ])
      setMembers(teamData.members)
      setInviteRequests(requestsData.requests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!highlightInviteRequestId) return
    const el = document.getElementById(`invite-request-${highlightInviteRequestId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [highlightInviteRequestId, inviteRequests])

  const onInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)
    setDevSignInUrl(null)
    try {
      const result = await fetchAdminBff<{
        member: TeamMember
        invitation?: { devSignInUrl?: string }
      }>(`/api/clients/${organizationId}/team`, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          clientOrgRole: role,
          canAccessSocialListening: socialListening,
        }),
      })
      setEmail('')
      if (result.invitation?.devSignInUrl) {
        setDevSignInUrl(result.invitation.devSignInUrl)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setSubmitting(false)
    }
  }

  const onPatch = async (
    userId: string,
    body: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean },
  ) => {
    try {
      await fetchAdminBff(`/api/clients/${organizationId}/team/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const onApproveRequest = async (requestId: string) => {
    setActingRequestId(requestId)
    setError(null)
    try {
      await fetchAdminBff(
        `/api/clients/${organizationId}/team/invite-requests/${requestId}/approve`,
        { method: 'POST' },
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setActingRequestId(null)
    }
  }

  const onRejectRequest = async (requestId: string) => {
    const reason = window.prompt('Optional reason for rejection (shown internally):') ?? ''
    setActingRequestId(requestId)
    setError(null)
    try {
      await fetchAdminBff(
        `/api/clients/${organizationId}/team/invite-requests/${requestId}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ rejectionReason: reason.trim() || undefined }),
        },
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setActingRequestId(null)
    }
  }

  const onSuspend = async (userId: string) => {
    if (!window.confirm('Suspend this portal user?')) return
    try {
      await fetchAdminBff(
        `/api/clients/${organizationId}/team/${userId}/suspend`,
        { method: 'POST' },
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suspend failed')
    }
  }

  return (
    <section
      className={
        embedded
          ? 'min-w-0'
          : 'admin-glass-card overflow-visible p-5 sm:p-6'
      }
    >
      {embedded ? null : (
        <>
          <h3 className={`text-lg text-chambray ${bricolage_grot600.className}`}>Portal team</h3>
          <p className="mt-1 text-sm text-app-muted">
            Add emails for this client org. Assign one owner (super user); they manage project
            managers and members in the client portal.
          </p>
        </>
      )}

      {inviteRequests.length > 0 ? (
        <div className="mt-4 rounded-xl border border-casablanca/30 bg-casablanca/10 p-4">
          <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
            Pending invite requests ({inviteRequests.length})
          </p>
          <p className="mt-1 text-xs text-app-muted">
            Project managers requested these emails from the client portal. Approve to send the
            Supabase invitation.
          </p>
          <ul className="mt-3 space-y-3">
            {inviteRequests.map((req) => {
              const highlighted = highlightInviteRequestId === req.id
              return (
                <li
                  key={req.id}
                  id={`invite-request-${req.id}`}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                    highlighted
                      ? 'border-sanmarino bg-white/80 ring-2 ring-sanmarino/40'
                      : 'border-chambray/10 bg-white/50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-chambray">{req.email}</p>
                    <p className="text-xs text-app-muted">
                      {roleLabels[req.requestedClientOrgRole]} · requested by {req.requestedByEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actingRequestId === req.id}
                      onClick={() => onApproveRequest(req.id)}
                      className="admin-btn-primary text-xs"
                    >
                      {actingRequestId === req.id ? '…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={actingRequestId === req.id}
                      onClick={() => onRejectRequest(req.id)}
                      className="admin-btn-ghost text-xs text-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {devSignInUrl ? (
        <p className="mt-2 text-sm">
          <a href={devSignInUrl} className="text-sanmarino underline">
            Dev sign-in link
          </a>
        </p>
      ) : null}

      <form onSubmit={onInvite} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@company.com"
          className="admin-input w-full max-w-md"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ClientOrgRole)}
            className="admin-input"
          >
            <option value="OWNER">Owner (super user)</option>
            <option value="PROJECT_MANAGER">Project manager</option>
            <option value="MEMBER">Member</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-app-muted">
            <input
              type="checkbox"
              checked={socialListening}
              onChange={(e) => setSocialListening(e.target.checked)}
            />
            Can view Social Listening
          </label>
          <button type="submit" disabled={submitting} className="admin-btn-primary text-sm">
            {submitting ? 'Inviting…' : 'Invite'}
          </button>
        </div>
      </form>

      <div className="mt-6 max-w-full overflow-x-auto overscroll-x-contain">
        {loading ? (
          <p className="text-sm text-app-muted">Loading…</p>
        ) : (
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-app-muted">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Social Listening</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-black/5">
                  <td className="py-2 pr-3">{member.email}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={member.clientOrgRole ?? 'MEMBER'}
                      disabled={member.clientOrgRole === 'OWNER'}
                      onChange={(e) =>
                        onPatch(member.id, {
                          clientOrgRole: e.target.value as ClientOrgRole,
                        })
                      }
                      className="admin-input py-1 text-sm"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="PROJECT_MANAGER">Project manager</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3 capitalize">{member.status.toLowerCase()}</td>
                  <td className="py-2 pr-3">
                    {member.clientOrgRole === 'OWNER' ? (
                      <span className="text-app-muted">Included with company subscription</span>
                    ) : (
                      <button
                        type="button"
                        className="text-sanmarino underline"
                        onClick={() =>
                          onPatch(member.id, {
                            canAccessSocialListening: !member.canAccessSocialListening,
                          })
                        }
                      >
                        {member.canAccessSocialListening ? 'On' : 'Off'}
                      </button>
                    )}
                  </td>
                  <td className="py-2">
                    {member.status !== 'SUSPENDED' ? (
                      <button
                        type="button"
                        className="text-red-600 underline"
                        onClick={() => onSuspend(member.id)}
                      >
                        Suspend
                      </button>
                    ) : (
                      roleLabels[member.clientOrgRole ?? 'MEMBER']
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
