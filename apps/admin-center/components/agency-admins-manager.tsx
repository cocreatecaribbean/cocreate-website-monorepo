'use client'

import { FormEvent, useState } from 'react'
import AdminToast from '@/components/admin-toast'
import DevSignInLink from '@/components/dev-sign-in-link'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
} from '@/lib/admin-api-fetch'
import { useSuspendAdminMutation, useUpdateAdminRoleMutation } from '@/lib/api/mutations/admins'
import { useAdminsQuery } from '@/lib/api/queries/admins'
import { adminRoleLabel, isSuperAdminSession } from '@/lib/admin-session'
import { useAdminSession } from '@/components/admin-session-provider'
import { bricolage_grot600 } from '@/styles/fonts'

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

  const { data: admins = [], isLoading, error: queryError, isError } = useAdminsQuery()
  const suspendMutation = useSuspendAdminMutation()
  const updateRoleMutation = useUpdateAdminRoleMutation()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)

  const loadError = isError
    ? queryError instanceof AdminApiFetchError
      ? `${queryError.message} — ${adminFetchErrorHint(queryError.code)}`
      : queryError instanceof Error
        ? queryError.message
        : 'Could not load agency admins.'
    : null

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
      await suspendMutation.mutateAsync(userId)
      setSuccess('Admin access suspended.')
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
      await updateRoleMutation.mutateAsync({ userId, role })
      setSuccess(role === 'SUPER_ADMIN' ? 'Promoted to super admin' : 'Set to admin')
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
      {error ?? loadError ? (
        <AdminToast message={error ?? loadError ?? ''} variant="error" onDismiss={() => setError(null)} />
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
        {isLoading ? (
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
                className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
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
