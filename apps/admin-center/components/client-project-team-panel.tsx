'use client'

import { FormEvent, useMemo, useState } from 'react'
import {
  useAddProjectClientMemberMutation,
  useRemoveProjectClientMemberMutation,
  useTransferProjectOwnershipMutation,
} from '@/lib/api/mutations/team'
import {
  useClientTeamQuery,
  useProjectClientMembersQuery,
} from '@/lib/api/queries/team'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  CONTRIBUTOR: 'Contributor',
  VIEWER: 'Viewer',
  SOCIAL_ANALYST: 'Social analyst',
}

type ClientProjectTeamPanelProps = {
  organizationId: string
  projectId: string
}

export default function ClientProjectTeamPanel({
  organizationId,
  projectId,
}: ClientProjectTeamPanelProps) {
  const membersQuery = useProjectClientMembersQuery(organizationId, projectId)
  const orgTeamQuery = useClientTeamQuery(organizationId)
  const addMutation = useAddProjectClientMemberMutation(organizationId, projectId)
  const removeMutation = useRemoveProjectClientMemberMutation(organizationId, projectId)
  const transferMutation = useTransferProjectOwnershipMutation(organizationId, projectId)

  const [selectedEmail, setSelectedEmail] = useState('')
  const [transferUserId, setTransferUserId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const data = membersQuery.data
  const assignableMembers = data?.assignableMembers ?? []
  const members = data?.members ?? []
  const ownerUserId = data?.ownerUserId ?? null
  const ownerEmail = data?.ownerEmail ?? null

  const adminCandidates = useMemo(() => {
    const rows = orgTeamQuery.data?.members ?? []
    return rows.filter(
      (member) =>
        member.clientOrgRole === 'ADMIN' &&
        member.id !== ownerUserId &&
        member.status !== 'SUSPENDED',
    )
  }, [orgTeamQuery.data?.members, ownerUserId])

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedEmail) return
    setError(null)
    setMessage(null)
    try {
      await addMutation.mutateAsync({ email: selectedEmail })
      setSelectedEmail('')
      setMessage('Teammate assigned to this project.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign member')
    }
  }

  const onRemove = async (userId: string) => {
    setError(null)
    try {
      await removeMutation.mutateAsync(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member')
    }
  }

  const onTransfer = async (event: FormEvent) => {
    event.preventDefault()
    if (!transferUserId) return
    const target = adminCandidates.find((a) => a.id === transferUserId)
    if (
      !window.confirm(
        `Transfer project ownership to ${target?.email ?? 'this Admin'}? Only the new owner can assign Contributors and Viewers.`,
      )
    ) {
      return
    }
    setError(null)
    setMessage(null)
    try {
      await transferMutation.mutateAsync({ newOwnerUserId: transferUserId })
      setTransferUserId('')
      setMessage('Project ownership transferred.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not transfer ownership')
    }
  }

  const submitting =
    addMutation.isPending || removeMutation.isPending || transferMutation.isPending

  return (
    <section className="admin-glass-card p-5 sm:p-6">
      <h3 className={`text-chambray ${bricolage_grot600.className}`}>Client team</h3>
      <p className={`mt-1 text-sm text-app-muted ${bricolage_grot500.className}`}>
        Assign Contributors and Viewers to this project, or transfer ownership between Admins.
        Admins already see every project; Social Analysts cannot be assigned.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-chambray">{message}</p> : null}

      {membersQuery.isLoading ? (
        <p className="mt-4 text-sm text-app-muted">Loading client team…</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2 text-sm">
            {ownerEmail ? (
              <li className="flex items-start justify-between gap-2 rounded-lg bg-sanmarino/10 px-3 py-2 ring-1 ring-sanmarino/20">
                <span className="min-w-0 truncate" title={ownerEmail}>
                  {ownerEmail}
                </span>
                <span className="shrink-0 text-xs font-medium text-sanmarino">Owner</span>
              </li>
            ) : null}
            {data?.creator.email && data.creator.email !== ownerEmail ? (
              <li className="flex items-start justify-between gap-2 rounded-lg bg-black/5 px-3 py-2">
                <span className="min-w-0 truncate" title={data.creator.email}>
                  {data.creator.email}
                </span>
                <span className="shrink-0 text-xs text-app-muted">Creator</span>
              </li>
            ) : null}
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-black/5 px-3 py-2"
              >
                <span className="min-w-0 truncate" title={member.email}>
                  {member.email}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-app-muted">
                  <span>
                    {member.clientOrgRole
                      ? roleLabels[member.clientOrgRole] ?? member.clientOrgRole
                      : 'Assigned'}
                  </span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void onRemove(member.userId)}
                    className="text-red-600 underline"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
            {!ownerEmail && !data?.creator.email && members.length === 0 ? (
              <li className="text-sm text-app-muted">No client team members yet.</li>
            ) : null}
          </ul>

          <form onSubmit={(e) => void onAdd(e)} className="mt-5 space-y-2">
            <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
              Assign Contributor or Viewer
            </p>
            {assignableMembers.length === 0 ? (
              <p className="text-sm text-app-muted">
                No unassigned Contributors or Viewers in this organization.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="admin-input min-w-[14rem] text-sm"
                >
                  <option value="">Select teammate…</option>
                  {assignableMembers.map((member) => (
                    <option key={member.userId} value={member.email}>
                      {member.email}
                      {member.clientOrgRole
                        ? ` — ${roleLabels[member.clientOrgRole] ?? member.clientOrgRole}`
                        : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedEmail || submitting}
                  className="admin-btn-primary text-sm"
                >
                  {addMutation.isPending ? 'Adding…' : 'Assign'}
                </button>
              </div>
            )}
          </form>

          <form onSubmit={(e) => void onTransfer(e)} className="mt-6 space-y-2">
            <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
              Transfer ownership
            </p>
            {adminCandidates.length === 0 ? (
              <p className="text-sm text-app-muted">
                No other Admins available to receive ownership.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  className="admin-input min-w-[14rem] text-sm"
                >
                  <option value="">Select Admin…</option>
                  {adminCandidates.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.email}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!transferUserId || submitting}
                  className="admin-btn-ghost text-sm"
                >
                  {transferMutation.isPending ? 'Transferring…' : 'Transfer'}
                </button>
              </div>
            )}
          </form>
        </>
      )}
    </section>
  )
}
