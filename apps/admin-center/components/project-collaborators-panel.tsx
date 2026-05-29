'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'

type CollaboratorRow = {
  id: string
  userId: string
  email: string
  status: string
  grantedByEmail: string
  createdAt: string
}

type RosterItem = {
  id: string
  email: string
  status: string
  projects: Array<{ id: string }>
}

type ProjectCollaboratorsPanelProps = {
  projectId: string
}

export default function ProjectCollaboratorsPanel({
  projectId,
}: ProjectCollaboratorsPanelProps) {
  const [rows, setRows] = useState<CollaboratorRow[]>([])
  const [roster, setRoster] = useState<RosterItem[]>([])
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, allCollaborators] = await Promise.all([
        fetchAdminBff<CollaboratorRow[]>(`/api/projects/${projectId}/collaborators`),
        fetchAdminBff<RosterItem[]>('/api/collaborators'),
      ])
      setRows(list)
      setRoster(allCollaborators)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load collaborators')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const availableFromRoster = useMemo(() => {
    const onProject = new Set(rows.map((r) => r.userId))
    return roster.filter((c) => !onProject.has(c.id) && c.status !== 'SUSPENDED')
  }, [roster, rows])

  useEffect(() => {
    if (availableFromRoster.length === 0) {
      setMode('new')
      return
    }
    if (!selectedUserId && availableFromRoster[0]) {
      setSelectedUserId(availableFromRoster[0].id)
    }
  }, [availableFromRoster, selectedUserId])

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setMessage(null)
    try {
      const body =
        mode === 'existing' && selectedUserId
          ? { userId: selectedUserId }
          : { email: email.trim() }

      const result = await fetchAdminBff<{
        message: string
        devSignInUrl?: string
      }>(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setEmail('')
      setMessage(
        result.devSignInUrl
          ? `${result.message} Dev link: ${result.devSignInUrl}`
          : result.message,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
    } finally {
      setInviting(false)
    }
  }

  async function onRemove(userId: string) {
    setError(null)
    try {
      await fetchAdminBff(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: 'DELETE',
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  return (
    <section className="admin-glass-card p-5 sm:p-6">
      <h3 className={`text-chambray ${bricolage_grot600.className}`}>Project collaborators</h3>
      <p className="mt-1 text-sm text-app-muted">
        Add freelancers from your agency roster or invite someone new. They only see this
        project in the collaborate portal — not the full admin hub.
      </p>

      <form onSubmit={(e) => void onAdd(e)} className="mt-4 space-y-3">
        {availableFromRoster.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`rounded-full px-3 py-1 text-xs ${bricolage_grot600.className} ${
                mode === 'existing'
                  ? 'bg-chambray text-white'
                  : 'bg-chambray/8 text-chambray'
              }`}
            >
              Existing collaborator
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-full px-3 py-1 text-xs ${bricolage_grot600.className} ${
                mode === 'new' ? 'bg-chambray text-white' : 'bg-chambray/8 text-chambray'
              }`}
            >
              New email
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {mode === 'existing' && availableFromRoster.length > 0 ? (
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="admin-input min-w-[220px] flex-1 text-sm"
            >
              {availableFromRoster.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.email} ({c.status.toLowerCase()})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborator@example.com"
              className="admin-input min-w-[220px] flex-1"
            />
          )}
          <button type="submit" disabled={inviting} className="admin-btn-primary text-sm">
            {inviting ? 'Adding…' : 'Add to project'}
          </button>
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-sanmarino">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-app-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-app-muted">No collaborators on this project yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-chambray/8">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <span className="font-medium text-chambray">{row.email}</span>
                <span className="ml-2 text-app-muted">({row.status})</span>
              </div>
              <button
                type="button"
                onClick={() => void onRemove(row.userId)}
                className="admin-btn-ghost text-sm text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
