'use client'

import { FormEvent, useEffect, useState } from 'react'

type PortalUser = {
  id: string
  email: string
  isActive: boolean
  createdAt: string
}

export default function ClientAccessManager() {
  const [users, setUsers] = useState<PortalUser[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/portal-users')
      if (!response.ok) throw new Error('Failed to load users')
      const data = (await response.json()) as PortalUser[]
      setUsers(data)
    } catch {
      setError('Could not load client portal users. Check API and ADMIN_API_KEY.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/portal-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to assign user')
      }
      setEmail('')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign user')
    } finally {
      setSubmitting(false)
    }
  }

  const deactivate = async (id: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/portal-users/${id}/deactivate`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to deactivate user')
      await loadUsers()
    } catch {
      setError('Could not deactivate user')
    }
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-chambray/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 md:flex-row md:items-stretch"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="client@company.com"
          className="min-h-11 min-w-0 flex-1 rounded-full border border-chambray/15 px-4 py-3 text-base outline-none focus:border-sanmarino sm:px-5"
        />
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full shrink-0 rounded-full bg-chambray px-6 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino disabled:opacity-60 md:w-auto"
        >
          {submitting ? 'Assigning…' : 'Assign access'}
        </button>
      </form>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-chambray/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold text-chambray sm:text-lg">Assigned emails</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No client portal users yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-chambray/10">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium wrap-break-word text-slate-900">{user.email}</p>
                  <p className="text-xs text-slate-500">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                {user.isActive ? (
                  <button
                    type="button"
                    onClick={() => void deactivate(user.id)}
                    className="min-h-10 w-full rounded-full border border-chambray/15 px-4 py-2 text-sm text-chambray transition hover:bg-chambray/5 sm:w-auto"
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
