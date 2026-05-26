'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import AdminToast from '@/components/admin-toast'
import DevSignInLink from '@/components/dev-sign-in-link'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'

type ClientRosterItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isSocialListeningSubscriber: boolean
  brand24ProjectId: string | null
  createdAt: string
  primaryContact: {
    id: string
    email: string
    status: 'INVITED' | 'ACTIVE' | 'SUSPENDED'
  } | null
}

const statusLabel: Record<string, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
}

export default function ClientAccessManager() {
  const [clients, setClients] = useState<ClientRosterItem[]>([])
  const [companyName, setCompanyName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [enableSocialListening, setEnableSocialListening] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)
  const [updatingSocialListeningId, setUpdatingSocialListeningId] = useState<string | null>(
    null,
  )
  const [savingBrand24Id, setSavingBrand24Id] = useState<string | null>(null)
  const [brand24Drafts, setBrand24Drafts] = useState<Record<string, string>>({})

  const loadClients = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await fetchAdminBff<ClientRosterItem[]>('/api/clients')
      setClients(data)
      setBrand24Drafts(
        Object.fromEntries(
          data.map((c) => [c.id, c.brand24ProjectId ?? '']),
        ),
      )
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not load clients.'
      setError(message)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadClients()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setDevSignInUrl(null)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          clientEmail,
          enableSocialListening,
          ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, `Invite failed (HTTP ${response.status})`),
        )
      }
      const payload = data as {
        invitation?: { devSignInUrl?: string }
      }
      setCompanyName('')
      setClientEmail('')
      setEnableSocialListening(false)
      setLogoUrl('')
      if (payload.invitation?.devSignInUrl) {
        setDevSignInUrl(payload.invitation.devSignInUrl)
        setSuccess(
          'Client created. Open the dev sign-in link below (no email sent).',
        )
      } else {
        setSuccess('Invitation sent. The client will receive an email shortly.')
      }
      await loadClients({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite client')
    } finally {
      setSubmitting(false)
    }
  }

  const suspend = async (userId: string) => {
    setError(null)
    setSuccess(null)
    try {
      await fetchAdminBff(`/api/clients/users/${userId}/suspend`, { method: 'POST' })
      setSuccess('Client access suspended.')
      await loadClients({ silent: true })
    } catch (err) {
      setError(
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not suspend client access',
      )
    }
  }

  const saveBrand24Project = async (organizationId: string) => {
    setError(null)
    setSuccess(null)
    setSavingBrand24Id(organizationId)
    try {
      const brand24ProjectId = brand24Drafts[organizationId]?.trim() || null
      const response = await fetch(
        `/api/clients/organizations/${organizationId}/brand24-project`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand24ProjectId }),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, 'Failed to save Brand24 project ID'))
      }
      setSuccess('Brand24 project ID saved.')
      await loadClients({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save Brand24 project ID')
    } finally {
      setSavingBrand24Id(null)
    }
  }

  const toggleSocialListening = async (organizationId: string, enabled: boolean) => {
    setError(null)
    setSuccess(null)
    setUpdatingSocialListeningId(organizationId)
    try {
      const response = await fetch(
        `/api/clients/organizations/${organizationId}/social-listening`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, 'Failed to update Social Listening access'),
        )
      }
      setSuccess(
        enabled
          ? 'Social Listening enabled for this client.'
          : 'Social Listening disabled for this client.',
      )
      await loadClients({ silent: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update Social Listening access',
      )
    } finally {
      setUpdatingSocialListeningId(null)
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
      <form
        onSubmit={onSubmit}
        className="admin-glass-card flex flex-col gap-4 p-5 sm:p-6"
      >
        <div>
          <p className="admin-eyebrow">Onboard</p>
          <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            Invite a client
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company name"
            className="admin-input"
          />
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            placeholder="client@company.com"
            className="admin-input"
          />
        </div>
        <input
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="Client logo URL (optional) — https://…"
          className="admin-input"
        />
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={enableSocialListening}
            onChange={(event) => setEnableSocialListening(event.target.checked)}
            className="h-4 w-4 rounded border-chambray/30 text-chambray focus:ring-sanmarino"
          />
          Enable Social Listening on invite (optional — you can also toggle per client below)
        </label>
        <button type="submit" disabled={submitting} className="admin-btn-primary md:w-fit">
          {submitting ? 'Sending invite…' : 'Invite client'}
        </button>
      </form>

      {devSignInUrl ? (
        <DevSignInLink url={devSignInUrl} label="Open client sign-in link" />
      ) : null}

      <section className="admin-glass-card p-5 sm:p-6">
        <p className="admin-eyebrow">Roster</p>
        <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
          Client roster
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Turn Social Listening on for test runs or comps. Optional Brand24 project ID
          is stored per client.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No clients onboarded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-chambray/6">
            {clients.map((client) => (
              <li
                key={client.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {client.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={client.logoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-contain"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sanmarino/20 to-chambray/10 text-xs font-semibold text-chambray ring-1 ring-sanmarino/15">
                      {client.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? '')
                        .join('') || '?'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-slate-900 hover:text-sanmarino"
                    >
                      {client.name}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {client.primaryContact?.email ?? 'No contact'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {client.primaryContact
                        ? statusLabel[client.primaryContact.status] ??
                          client.primaryContact.status
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:max-w-md">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={brand24Drafts[client.id] ?? ''}
                      onChange={(e) =>
                        setBrand24Drafts((prev) => ({
                          ...prev,
                          [client.id]: e.target.value,
                        }))
                      }
                      placeholder="Brand24 project ID (optional)"
                      className="admin-input min-h-10 flex-1 text-sm"
                      disabled={!client.isSocialListeningSubscriber}
                    />
                    <button
                      type="button"
                      disabled={
                        savingBrand24Id === client.id ||
                        !client.isSocialListeningSubscriber
                      }
                      onClick={() => void saveBrand24Project(client.id)}
                      className="admin-btn-ghost min-h-10 shrink-0 px-4"
                    >
                      {savingBrand24Id === client.id ? 'Saving…' : 'Save ID'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-white/60 bg-white/50 px-4 py-2 text-sm text-slate-700 backdrop-blur-sm">
                    <input
                      type="checkbox"
                      checked={client.isSocialListeningSubscriber}
                      disabled={updatingSocialListeningId === client.id}
                      onChange={(event) =>
                        void toggleSocialListening(client.id, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-chambray/30 text-chambray focus:ring-sanmarino disabled:opacity-50"
                    />
                    <span>
                      Social Listening
                      {updatingSocialListeningId === client.id ? '…' : ''}
                    </span>
                  </label>
                  <Link
                    href={`/clients/${client.id}`}
                    className="admin-btn-primary min-h-10 w-full text-center sm:w-auto"
                  >
                    Workspace
                  </Link>
                  {client.primaryContact &&
                  client.primaryContact.status !== 'SUSPENDED' ? (
                    <button
                      type="button"
                      onClick={() => void suspend(client.primaryContact!.id)}
                      className="admin-btn-ghost min-h-10 w-full sm:w-auto"
                    >
                      Suspend
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
