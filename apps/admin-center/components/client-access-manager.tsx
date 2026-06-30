'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AdminToast from '@/components/admin-toast'
import ClientTeamPanel from '@/components/client-team-panel'
import DevSignInLink from '@/components/dev-sign-in-link'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { useSuspendClientUserMutation } from '@/lib/api/mutations/clients'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { useClientsQuery } from '@/lib/api/queries/clients'
import { bricolage_grot600 } from '@/styles/fonts'
type ClientOrgRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER'

const orgRoleBadge: Record<ClientOrgRole, string> = {
  OWNER: 'Owner',
  PROJECT_MANAGER: 'Project manager',
  MEMBER: 'Member',
}

function OrgRoleBadge({ role }: { role: ClientOrgRole | null }) {
  if (!role) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        Unassigned
      </span>
    )
  }
  const isOwner = role === 'OWNER'
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isOwner
          ? 'bg-chambray/15 text-chambray'
          : 'bg-sanmarino/10 text-sanmarino'
      }`}
    >
      {orgRoleBadge[role]}
    </span>
  )
}

const statusLabel: Record<string, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
}

export default function ClientAccessManager() {
  const queryClient = useQueryClient()
  const { data: clients = [], isLoading, error: queryError, isError } = useClientsQuery()
  const suspendMutation = useSuspendClientUserMutation()

  const [companyName, setCompanyName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [enableSocialListening, setEnableSocialListening] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)
  const [savingBrand24Id, setSavingBrand24Id] = useState<string | null>(null)
  const [brand24Drafts, setBrand24Drafts] = useState<Record<string, string>>({})
  const [expandedTeamOrgId, setExpandedTeamOrgId] = useState<string | null>(null)
  const [settingOwnerUserId, setSettingOwnerUserId] = useState<string | null>(null)

  const loadError = isError
    ? queryError instanceof AdminApiFetchError
      ? `${queryError.message} — ${adminFetchErrorHint(queryError.code)}`
      : queryError instanceof Error
        ? queryError.message
        : 'Could not load clients.'
    : null

  useEffect(() => {
    setBrand24Drafts(
      Object.fromEntries(clients.map((c) => [c.id, c.brand24ProjectId ?? ''])),
    )
  }, [clients])

  const onLogoChange = async (file: File | null) => {
    if (!file) return
    setLogoUploading(true)
    setError(null)
    try {
      const urlRes = await fetchAdminBff<{
        signedUrl?: string
        publicUrl?: string
      }>('/api/clients/logo/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.signedUrl || !urlRes.publicUrl) {
        throw new Error('Upload URL missing')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!upload.ok) throw new Error('Logo upload failed')

      setLogoUrl(urlRes.publicUrl)
      setLogoFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload logo')
    } finally {
      setLogoUploading(false)
    }
  }

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
      setLogoFileName(null)
      if (payload.invitation?.devSignInUrl) {
        setDevSignInUrl(payload.invitation.devSignInUrl)
        setSuccess(
          'Organization owner invited. Open the dev sign-in link below (no email sent).',
        )
      } else {
        setSuccess(
          'Organization owner invited. They will receive a sign-in email shortly.',
        )
      }
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
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
      await suspendMutation.mutateAsync(userId)
      setSuccess('Client access suspended.')
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save Brand24 project ID')
    } finally {
      setSavingBrand24Id(null)
    }
  }

  const setAsOrgOwner = async (organizationId: string, userId: string) => {
    setError(null)
    setSuccess(null)
    setSettingOwnerUserId(userId)
    try {
      await fetchAdminBff(`/api/clients/${organizationId}/team/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientOrgRole: 'OWNER' }),
      })
      setSuccess('Organization owner updated. They can manage portal team in the client portal.')
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(organizationId),
      })
    } catch (err) {
      setError(
        err instanceof AdminApiFetchError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not set organization owner',
      )
    } finally {
      setSettingOwnerUserId(null)
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
      <form
        onSubmit={onSubmit}
        className="admin-glass-card flex flex-col gap-4 p-5 sm:p-6"
      >
        <div>
          <p className="admin-eyebrow">Onboard</p>
          <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            Invite client organization
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            The email below becomes the org owner (super user) for this company.
          </p>
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
        <div className="flex items-center gap-3">
          <label className="admin-btn-ghost cursor-pointer text-sm">
            {logoUploading ? 'Uploading…' : 'Upload client logo (optional)'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={logoUploading}
              onChange={(e) => void onLogoChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {logoUrl && !logoUploading ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-8 w-auto max-w-[120px] rounded object-contain"
            />
          ) : logoFileName && !logoUploading ? (
            <span className="text-sm text-app-muted">{logoFileName}</span>
          ) : null}
          {logoUrl ? (
            <button
              type="button"
              onClick={() => { setLogoUrl(''); setLogoFileName(null) }}
              className="text-xs text-app-muted hover:text-chambray"
            >
              Remove
            </button>
          ) : null}
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-app-primary">
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

      <section className="admin-glass-card overflow-visible p-5 sm:p-6">
        <p className="admin-eyebrow">Roster</p>
        <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
          Client roster
        </h2>
        <p className="mt-1 text-sm text-app-muted">
          Set the org owner (super user) per client. Owners manage portal team; project
          managers and members are assigned in the client portal. Optional Brand24 project
          ID per subscriber.
        </p>
        {isLoading ? (
          <p className="mt-4 text-sm text-app-muted">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="mt-4 text-sm text-app-muted">No clients onboarded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-chambray/6">
            {clients.map((client) => (
              <li key={client.id} className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      className="font-medium text-app-primary hover:text-sanmarino"
                    >
                      {client.name}
                    </Link>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-app-muted">
                      <span>{client.primaryContact?.email ?? 'No contact'}</span>
                      {client.primaryContact ? (
                        <OrgRoleBadge role={client.primaryContact.clientOrgRole} />
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-app-muted">
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
                  <Link
                    href={`/social-listening/subscriptions/${client.id}`}
                    className="admin-btn-ghost inline-flex min-h-10 items-center justify-center px-4"
                  >
                    Social Listening
                  </Link>
                  {client.primaryContact &&
                  client.primaryContact.clientOrgRole !== 'OWNER' &&
                  client.primaryContact.status !== 'SUSPENDED' ? (
                    <button
                      type="button"
                      disabled={settingOwnerUserId === client.primaryContact.id}
                      onClick={() =>
                        void setAsOrgOwner(client.id, client.primaryContact!.id)
                      }
                      className="admin-btn-ghost min-h-10 w-full sm:w-auto"
                    >
                      {settingOwnerUserId === client.primaryContact.id
                        ? 'Setting…'
                        : 'Set as org owner'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTeamOrgId((current) =>
                        current === client.id ? null : client.id,
                      )
                    }
                    className="admin-btn-ghost min-h-10 w-full sm:w-auto"
                  >
                    {expandedTeamOrgId === client.id ? 'Hide team' : 'Manage team'}
                  </button>
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
                </div>
                {expandedTeamOrgId === client.id ? (
                  <div className="mt-4 w-full min-w-0 border-t border-chambray/10 pt-4">
                    <div className="ml-3 mr-1 rounded-xl border border-chambray/10 bg-chambray/[0.04] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] sm:ml-6 sm:p-5 dark:border-white/10 dark:bg-white/[0.06]">
                      <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-app-muted uppercase">
                        Portal team
                      </p>
                      <div className="mt-3 min-w-0">
                        <ClientTeamPanel organizationId={client.id} embedded />
                      </div>
                    </div>
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
