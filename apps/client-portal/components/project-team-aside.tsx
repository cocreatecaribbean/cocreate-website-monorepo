'use client'

import { FormEvent } from 'react'
import { useProjectMembers } from '@/lib/team/use-project-members'
import type { AssignableProjectMember, ClientOrgRole } from '@/lib/team/fetch-team-client'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

const roleLabels: Record<ClientOrgRole, string> = {
  OWNER: 'Owner',
  PROJECT_MANAGER: 'Project manager',
  MEMBER: 'Member',
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
    canManage,
    loading,
    error,
    submitting,
    selectedEmail,
    setSelectedEmail,
    access,
    setAccess,
    addMember,
    removeMember,
  } = useProjectMembers(projectId)

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !selectedEmail) return
    await addMember(selectedEmail, access)
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
          ? 'People who can access this project. Add teammates from your organization.'
          : 'People who can access this project.'}
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
          {creatorEmail ? (
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
                <span>{member.access === 'MANAGE' ? 'Manage' : 'View'}</span>
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
          {!creatorEmail && members.length === 0 ? (
            <li className="text-sm text-app-muted">No team members yet.</li>
          ) : null}
        </ul>
      )}

      {canManage && !loading ? (
        <form onSubmit={onAdd} className="mt-4 space-y-2 border-t border-chambray/10 pt-4 dark:border-white/10">
          <p className={`text-xs text-app-muted ${bricolage_grot600.className}`}>Add teammate</p>
          <select
            required
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            disabled={assignableMembers.length === 0}
            className="portal-input w-full rounded-full px-3 py-2 text-sm"
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
          <div className="flex gap-2">
            <select
              value={access}
              onChange={(e) =>
                setAccess(e.target.value as 'VIEW' | 'MANAGE')
              }
              className="portal-input min-w-0 flex-1 rounded-full px-3 py-2 text-sm"
            >
              <option value="VIEW">View</option>
              <option value="MANAGE">Manage</option>
            </select>
            <button
              type="submit"
              disabled={!canSubmitAdd}
              className="portal-btn-primary shrink-0 px-4 text-sm"
            >
              Add
            </button>
          </div>
          {assignableMembers.length === 0 ? (
            <p className="text-xs text-app-muted">
              Everyone on your team already has access, or invite more people from Team.
            </p>
          ) : null}
        </form>
      ) : null}
    </aside>
  )
}
