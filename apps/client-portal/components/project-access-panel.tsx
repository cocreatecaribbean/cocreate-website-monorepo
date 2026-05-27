'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  addProjectMember,
  fetchProjectMembers,
  removeProjectMember,
  type ClientProjectAccessLevel,
  type ProjectMember,
} from '@/lib/team/fetch-team-client'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

export default function ProjectAccessPanel({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [creatorEmail, setCreatorEmail] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [access, setAccess] = useState<ClientProjectAccessLevel>('VIEW')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProjectMembers(projectId)
      setMembers(data.members)
      setCreatorEmail(data.creator.email)
      setCanManage(data.canManage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access list')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  if (!loading && !canManage && members.length === 0) {
    return null
  }

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !email.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await addProjectMember(projectId, { email: email.trim(), access })
      setEmail('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member')
    } finally {
      setSubmitting(false)
    }
  }

  const onRemove = async (userId: string) => {
    try {
      await removeProjectMember(projectId, userId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member')
    }
  }

  return (
    <section className="portal-glass-card mt-6 p-5 sm:p-6">
      <p className="portal-eyebrow">Project access</p>
      <h4 className={`mt-1 text-base text-app-heading ${bricolage_grot600.className}`}>
        Who can see this project
      </h4>
      <p className={`mt-1 text-sm text-app-muted ${bricolage_grot500.className}`}>
        The project creator always has full access. Add teammates by email; other project
        managers only see this project if you add them here.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-app-muted">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          {creatorEmail ? (
            <li className="flex justify-between gap-2 rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5">
              <span>{creatorEmail}</span>
              <span className="text-app-muted">Creator · Manage</span>
            </li>
          ) : null}
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5"
            >
              <span>{member.email}</span>
              <span className="flex items-center gap-3 text-app-muted">
                {member.access === 'MANAGE' ? 'Manage' : 'View'}
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => onRemove(member.userId)}
                    className="text-red-600 underline"
                  >
                    Remove
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form onSubmit={onAdd} className="mt-4 flex flex-wrap items-end gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="portal-input min-w-[12rem] flex-1 rounded-full px-4 py-2 text-sm"
          />
          <select
            value={access}
            onChange={(e) => setAccess(e.target.value as ClientProjectAccessLevel)}
            className="portal-input rounded-full px-3 py-2 text-sm"
          >
            <option value="VIEW">View</option>
            <option value="MANAGE">Manage</option>
          </select>
          <button type="submit" disabled={submitting} className="portal-btn-primary text-sm">
            Add
          </button>
        </form>
      ) : null}
    </section>
  )
}
