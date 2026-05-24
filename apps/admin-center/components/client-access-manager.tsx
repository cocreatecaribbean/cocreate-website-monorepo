'use client'

import { FormEvent, useEffect, useState } from 'react'
import DevSignInLink from '@/components/dev-sign-in-link'
import { getApiErrorMessage } from '@/lib/api-error'

type ClientRosterItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isSocialListeningSubscriber: boolean
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

  const loadClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Failed to load clients')
      const data = (await response.json()) as ClientRosterItem[]
      setClients(data)
    } catch {
      setError('Could not load clients. Sign in again or check the API connection.')
    } finally {
      setLoading(false)
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
      await loadClients()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite client')
    } finally {
      setSubmitting(false)
    }
  }

  const suspend = async (userId: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/clients/${userId}/suspend`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to suspend client')
      await loadClients()
    } catch {
      setError('Could not suspend client access')
    }
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-chambray/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company name"
            className="min-h-11 min-w-0 rounded-full border border-chambray/15 px-4 py-3 text-base outline-none focus:border-sanmarino sm:px-5"
          />
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            placeholder="client@company.com"
            className="min-h-11 min-w-0 rounded-full border border-chambray/15 px-4 py-3 text-base outline-none focus:border-sanmarino sm:px-5"
          />
        </div>
        <input
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="Client logo URL (optional) — https://…"
          className="min-h-11 min-w-0 rounded-full border border-chambray/15 px-4 py-3 text-base outline-none focus:border-sanmarino sm:px-5"
        />
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={enableSocialListening}
            onChange={(event) => setEnableSocialListening(event.target.checked)}
            className="h-4 w-4 rounded border-chambray/30 text-chambray focus:ring-sanmarino"
          />
          Enable Social Listening (premium tier)
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full rounded-full bg-chambray px-6 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino disabled:opacity-60 md:w-fit"
        >
          {submitting ? 'Sending invite…' : 'Invite client'}
        </button>
      </form>

      {success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>
      ) : null}
      {devSignInUrl ? (
        <DevSignInLink url={devSignInUrl} label="Open client sign-in link" />
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-chambray/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold text-chambray sm:text-lg">Client roster</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No clients onboarded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-chambray/10">
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chambray/10 text-xs font-semibold text-chambray">
                      {client.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? '')
                        .join('') || '?'}
                    </span>
                  )}
                  <div className="min-w-0">
                  <p className="font-medium text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-600">
                    {client.primaryContact?.email ?? 'No contact'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {client.primaryContact
                      ? statusLabel[client.primaryContact.status] ?? client.primaryContact.status
                      : '—'}
                    {client.isSocialListeningSubscriber ? ' · Social Listening' : ''}
                  </p>
                  </div>
                </div>
                {client.primaryContact &&
                client.primaryContact.status !== 'SUSPENDED' ? (
                  <button
                    type="button"
                    onClick={() => void suspend(client.primaryContact!.id)}
                    className="min-h-10 w-full rounded-full border border-chambray/15 px-4 py-2 text-sm text-chambray transition hover:bg-chambray/5 sm:w-auto"
                  >
                    Suspend
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
