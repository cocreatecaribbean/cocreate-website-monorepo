'use client'

import { FormEvent, useMemo } from 'react'
import { useProjectMembers } from '@/lib/team/use-project-members'
import { useOrgTeamQuery } from '@/lib/api/queries/team'
import type { AssignableProjectMember, ClientOrgRole } from '@/lib/team/fetch-team-client'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

const roleLabels: Record<ClientOrgRole, string> = {
  ADMIN: 'Admin',
  CONTRIBUTOR: 'Contributor',
  VIEWER: 'Viewer',
  SOCIAL_ANALYST: 'Social analyst',
}

function assignableLabel(member: AssignableProjectMember) {
  const role = member.clientOrgRole ? roleLabels[member.clientOrgRole] : 'Member'
  return `${member.email} — ${role}`
}

type ProjectTeamAsideProps = {
  projectId: string
  className?: string
}

export default function ProjectTeamAside({ projectId, className = '' }: ProjectTeamAsideProps) {
  const {
    members,
    assignableMembers,
    creatorEmail,
    ownerEmail,
    ownerUserId,
    viewerIsOwner,
    canTransferOwnership,
    canManage,
    loading,
    error,
    submitting,
    selectedEmail,
    setSelectedEmail,
    transferUserId,
    setTransferUserId,
    addMember,
    removeMember,
    transferOwnership,
  } = useProjectMembers(projectId)

  const { data: orgTeam } = useOrgTeamQuery()
  const adminCandidates = useMemo(() => {
    const rows = orgTeam?.members ?? []
    return rows.filter(
      (member) =>
        member.clientOrgRole === 'ADMIN' &&
        member.id !== ownerUserId &&
        member.status !== 'SUSPENDED',
    )
  }, [orgTeam?.members, ownerUserId])

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !selectedEmail) return
    await addMember(selectedEmail)
  }

  const onTransfer = async (event: FormEvent) => {
    event.preventDefault()
    if (!canTransferOwnership || !transferUserId) return
    const target = adminCandidates.find((a) => a.id === transferUserId)
    if (
      !window.confirm(
        `Transfer project ownership to ${target?.email ?? 'this Admin'}? Only the new owner will be able to assign people.`,
      )
    ) {
      return
    }
    await transferOwnership(transferUserId)
  }

  const canSubmitAdd =
    Boolean(selectedEmail) && assignableMembers.length > 0 && !submitting

  return (
    <aside
      className={`portal-glass-card p-4 sm:p-5 ${className}`.trim()}
      aria-label="Project team"
    >
      <p className="portal-eyebrow">Project team</p>
      <p className={`mt-1 text-xs leading-relaxed text-app-muted ${bricolage_grot500.className}`}>
        {canManage
          ? 'As project owner, assign Contributors and Viewers to this project.'
          : viewerIsOwner
            ? 'People assigned to this project.'
            : 'Only the project owner can assign people — transfer ownership or ask CoCreate.'}
      </p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-app-muted">Loading team…</p>
      ) : (
        <ul className="mt-4 space-y-1.5 text-sm">
          {ownerEmail ? (
            <li className="flex items-start justify-between gap-2 rounded-lg bg-sanmarino/10 px-3 py-2 ring-1 ring-sanmarino/20">
              <span className="min-w-0 truncate" title={ownerEmail}>
                {ownerEmail}
              </span>
              <span className="shrink-0 text-xs font-medium text-sanmarino">Owner</span>
            </li>
          ) : null}
          {creatorEmail && creatorEmail !== ownerEmail ? (
            <li className="flex items-start justify-between gap-2 rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5">
              <span className="min-w-0 truncate" title={creatorEmail}>
                {creatorEmail}
              </span>
              <span className="shrink-0 text-xs text-app-muted">Creator</span>
            </li>
          ) : null}
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5"
            >
              <span className="min-w-0 truncate" title={member.email}>
                {member.email}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-app-muted">
                <span>
                  {member.clientOrgRole
                    ? roleLabels[member.clientOrgRole]
                    : 'Assigned'}
                </span>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => void removeMember(member.userId)}
                    className="text-red-600 underline"
                  >
                    Remove
                  </button>
                ) : null}
              </span>
            </li>
          ))}
          {!ownerEmail && !creatorEmail && members.length === 0 ? (
            <li className="text-sm text-app-muted">No team members yet.</li>
          ) : null}
        </ul>
      )}

      {canManage && !loading ? (
        <form onSubmit={onAdd} className="mt-4 space-y-2 border-t border-chambray/10 pt-4 dark:border-white/10">
          <p className={`text-xs text-app-muted ${bricolage_grot600.className}`}>Assign teammate</p>
          <select
            required
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            disabled={assignableMembers.length === 0}
            className="portal-input w-full text-sm"
          >
            <option value="">
              {assignableMembers.length === 0
                ? 'No teammates available'
                : 'Select a teammate…'}
            </option>
            {assignableMembers.map((member) => (
              <option key={member.userId} value={member.email}>
                {assignableLabel(member)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canSubmitAdd}
            className="portal-btn-primary w-full px-4 text-sm"
          >
            Assign
          </button>
          {assignableMembers.length === 0 ? (
            <p className="text-xs text-app-muted">
              Everyone eligible is already assigned, or invite more people from Team.
            </p>
          ) : null}
        </form>
      ) : null}

      {!canManage && !viewerIsOwner && !loading ? (
        <p className="mt-4 border-t border-chambray/10 pt-4 text-xs text-app-muted dark:border-white/10">
          Only the project owner can assign people — transfer ownership or ask CoCreate.
        </p>
      ) : null}

      {canTransferOwnership && !loading ? (
        <form
          onSubmit={(e) => void onTransfer(e)}
          className="mt-4 space-y-2 border-t border-chambray/10 pt-4 dark:border-white/10"
        >
          <p className={`text-xs text-app-muted ${bricolage_grot600.className}`}>
            Transfer ownership
          </p>
          <select
            required
            value={transferUserId}
            onChange={(e) => setTransferUserId(e.target.value)}
            disabled={adminCandidates.length === 0}
            className="portal-input w-full text-sm"
          >
            <option value="">
              {adminCandidates.length === 0
                ? 'No other Admins available'
                : 'Select an Admin…'}
            </option>
            {adminCandidates.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.email}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!transferUserId || submitting || adminCandidates.length === 0}
            className="portal-btn-ghost w-full text-sm"
          >
            Transfer ownership
          </button>
        </form>
      ) : null}
    </aside>
  )
}
