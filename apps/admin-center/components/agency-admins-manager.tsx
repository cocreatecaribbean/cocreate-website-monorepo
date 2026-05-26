'use client'

import { FormEvent, useEffect, useState } from 'react'
import AdminToast from '@/components/admin-toast'
import DevSignInLink from '@/components/dev-sign-in-link'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { adminRoleLabel, isSuperAdminSession } from '@/lib/admin-session'
import { useAdminSession } from '@/components/admin-session-provider'
import { bricolage_grot600 } from '@/styles/fonts'

type AdminRosterItem = {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
}

const statusLabel: Record<string, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
}

export default function AgencyAdminsManager() {
  const { session } = useAdminSession()
  const isSuper = isSuperAdminSession(
    session?.mode === 'api_key' ? 'api_key' : session?.role ?? null,
  )

  const [admins, setAdmins] = useState<AdminRosterItem[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)

  const loadAdmins = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await fetchAdminBff<AdminRosterItem[]>('/api/admins')
      setAdmins(data)
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not load agency admins.'
      setError(message)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadAdmins()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isSuper) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setDevSignInUrl(null)

    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, 'Failed to invite admin'))
      }

      setEmail('')
      setSuccess(data.message ?? 'Admin invited.')
      if (data.devSignInUrl) {
        setDevSignInUrl(data.devSignInUrl)
      }
      await loadAdmins({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setSubmitting(false)
    }
  }

  const suspend = async (userId: string) => {
    setError(null)
    setSuccess(null)
    try {
      await fetchAdminBff(`/api/admins/${userId}/suspend`, { method: 'POST' })
      setSuccess('Admin access suspended.')
      await loadAdmins({ silent: true })
    } catch (err) {
      setError(
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not suspend admin',
      )
    }
  }

  const setRole = async (userId: string, role: 'SUPER_ADMIN' | 'ADMIN') => {
    setError(null)
    setSuccess(null)
    try {
      await fetchAdminBff(`/api/admins/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      setSuccess(role === 'SUPER_ADMIN' ? 'Promoted to super admin' : 'Set to admin')
      await loadAdmins({ silent: true })
    } catch (err) {
      setError(
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not update role',
      )
    }
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {success ? (
        <AdminToast message={success} variant="success" onDismiss={() => setSuccess(null)} />
      ) : null}
      {error ? (
        <AdminToast message={error} variant="error" onDismiss={() => setError(null)} />
      ) : null}

      {isSuper ? (
        <form
          onSubmit={onSubmit}
          className="admin-glass-card flex flex-col gap-4 p-5 sm:p-6"
        >
          <div>
            <p className="admin-eyebrow">Access</p>
            <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
              Invite agency admin
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              New invites join as standard admins. Promote to super admin from the roster below.
              The first account is created with{' '}
              <code className="rounded bg-chambray/5 px-1 text-xs">seed:admin</code> as super
              admin.
            </p>
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@cocreate.com"
            className="admin-input"
          />
          <button type="submit" disabled={submitting} className="admin-btn-primary md:w-fit">
            {submitting ? 'Sending…' : 'Invite admin'}
          </button>
        </form>
      ) : (
        <p className="admin-glass-card p-5 text-sm text-slate-600">
          Only super admins can invite or change team access. Contact your super admin if you
          need someone added.
        </p>
      )}

      {devSignInUrl ? <DevSignInLink url={devSignInUrl} label="Open admin sign-in link" /> : null}

      <section className="admin-glass-card p-5 sm:p-6">
        <p className="admin-eyebrow">Roster</p>
        <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
          Agency admins
        </h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : admins.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No admins yet. Run the seed script or invite someone above.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-chambray/6">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className={`text-chambray ${bricolage_grot600.className}`}>{admin.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {adminRoleLabel(admin.role)} · {statusLabel[admin.status] ?? admin.status}
                  </p>
                </div>
                {isSuper && admin.status !== 'SUSPENDED' ? (
                  <div className="flex flex-wrap gap-2">
                    {admin.role === 'ADMIN' ? (
                      <button
                        type="button"
                        onClick={() => void setRole(admin.id, 'SUPER_ADMIN')}
                        className="admin-btn-ghost min-h-10 text-xs"
                      >
                        Make super admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void setRole(admin.id, 'ADMIN')}
                        className="admin-btn-ghost min-h-10 text-xs"
                      >
                        Demote to admin
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void suspend(admin.id)}
                      className="admin-btn-ghost min-h-10 text-xs"
                    >
                      Suspend
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
