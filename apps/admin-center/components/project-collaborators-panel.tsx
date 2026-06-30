'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  useAddProjectCollaboratorMutation,
  useRemoveProjectCollaboratorMutation,
} from '@/lib/api/mutations/collaborators'
import { useProjectCollaboratorsQuery } from '@/lib/api/queries/collaborators'
import { bricolage_grot600 } from '@/styles/fonts'

type ProjectCollaboratorsPanelProps = {
  projectId: string
}

export default function ProjectCollaboratorsPanel({
  projectId,
}: ProjectCollaboratorsPanelProps) {
  const { data, isLoading, error: queryError, isError } = useProjectCollaboratorsQuery(projectId)
  const addMutation = useAddProjectCollaboratorMutation(projectId)
  const removeMutation = useRemoveProjectCollaboratorMutation(projectId)

  const rows = data?.collaborators ?? []
  const roster = data?.roster ?? []

  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadError = isError
    ? queryError instanceof Error
      ? queryError.message
      : 'Could not load collaborators'
    : null

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
    setError(null)
    setMessage(null)
    try {
      const body =
        mode === 'existing' && selectedUserId
          ? { userId: selectedUserId }
          : { email: email.trim() }

      const result = await addMutation.mutateAsync(body)
      setEmail('')
      setMessage(
        result.devSignInUrl
          ? `${result.message} Dev link: ${result.devSignInUrl}`
          : result.message,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
    }
  }

  async function onRemove(userId: string) {
    setError(null)
    try {
      await removeMutation.mutateAsync(userId)
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
          <button type="submit" disabled={addMutation.isPending} className="admin-btn-primary text-sm">
            {addMutation.isPending ? 'Adding…' : 'Add to project'}
          </button>
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-sanmarino">{message}</p> : null}
      {error ?? loadError ? (
        <p className="mt-3 text-sm text-red-600">{error ?? loadError}</p>
      ) : null}

      {isLoading ? (
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
