'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { useSuspendClientUserMutation } from '@/lib/api/mutations/clients'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { getApiErrorMessage } from '@/lib/api-error'
import type { ClientOrganizationRosterItem } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'

type ClientOrgRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER'

type ClientAdminSettingsPanelProps = {
  client: ClientOrganizationRosterItem
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function ClientAdminSettingsPanel({
  client,
  onSuccess,
  onError,
}: ClientAdminSettingsPanelProps) {
  const queryClient = useQueryClient()
  const suspendMutation = useSuspendClientUserMutation()
  const [brand24Draft, setBrand24Draft] = useState(client.brand24ProjectId ?? '')
  const [savingBrand24Id, setSavingBrand24Id] = useState(false)
  const [settingOwnerUserId, setSettingOwnerUserId] = useState<string | null>(null)

  useEffect(() => {
    setBrand24Draft(client.brand24ProjectId ?? '')
  }, [client.brand24ProjectId, client.id])

  const saveBrand24Project = async () => {
    setSavingBrand24Id(true)
    try {
      const brand24ProjectId = brand24Draft.trim() || null
      const response = await fetch(
        `/api/clients/organizations/${client.id}/brand24-project`,
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
      onSuccess('Brand24 project ID saved.')
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.clients.detail(client.id),
      })
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save Brand24 project ID')
    } finally {
      setSavingBrand24Id(false)
    }
  }

  const setAsOrgOwner = async (userId: string) => {
    setSettingOwnerUserId(userId)
    try {
      await fetchAdminBff(`/api/clients/${client.id}/team/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientOrgRole: 'OWNER' }),
      })
      onSuccess('Organization owner updated. They can manage portal team in the client portal.')
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.clients.detail(client.id),
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(client.id),
      })
    } catch (err) {
      onError(
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

  const suspend = async (userId: string) => {
    try {
      await suspendMutation.mutateAsync(userId)
      onSuccess('Client access suspended.')
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.clients.detail(client.id),
      })
    } catch (err) {
      onError(
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not suspend client access',
      )
    }
  }

  const contact = client.primaryContact
  const contactRole = contact?.clientOrgRole as ClientOrgRole | null | undefined

  return (
    <section className="admin-glass-card max-w-2xl p-5 sm:p-6">
      <p className="admin-eyebrow">Administration</p>
      <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
        Client settings
      </h2>
      <p className="mt-1 text-sm text-app-muted">
        Portal access, social listening, and organization owner controls.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/social-listening/subscriptions/${client.id}`}
          className="admin-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm"
        >
          Social Listening
        </Link>
        {contact && contactRole !== 'OWNER' && contact.status !== 'SUSPENDED' ? (
          <button
            type="button"
            disabled={settingOwnerUserId === contact.id}
            onClick={() => void setAsOrgOwner(contact.id)}
            className="admin-btn-ghost min-h-10 text-sm"
          >
            {settingOwnerUserId === contact.id ? 'Setting…' : 'Set as org owner'}
          </button>
        ) : null}
        {contact && contact.status !== 'SUSPENDED' ? (
          <button
            type="button"
            onClick={() => void suspend(contact.id)}
            className="admin-btn-ghost min-h-10 text-sm"
          >
            Suspend access
          </button>
        ) : null}
      </div>

      {client.isSocialListeningSubscriber ? (
        <div className="mt-5 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`brand24-${client.id}`}
              className="text-sm font-medium text-chambray"
            >
              Brand24 project ID
            </label>
            {client.brand24ProjectId ? (
              <p className="mt-1 text-xs text-app-muted">
                {client.socialListeningLastSnapshotDate
                  ? `Last snapshot: ${client.socialListeningLastSnapshotDate} (${client.socialListeningLastSnapshotSource ?? 'unknown'})`
                  : 'No snapshots yet — complete client setup or wait for daily capture'}
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-800">
                Required for live Brand24 data when API is enabled
              </p>
            )}
            <input
              id={`brand24-${client.id}`}
              type="text"
              value={brand24Draft}
              onChange={(e) => setBrand24Draft(e.target.value)}
              placeholder="Brand24 project ID"
              className="admin-input mt-2 min-h-10 w-full text-sm"
            />
          </div>
          <button
            type="button"
            disabled={savingBrand24Id}
            onClick={() => void saveBrand24Project()}
            className="admin-btn-ghost min-h-10 shrink-0 px-4 text-sm sm:w-auto"
          >
            {savingBrand24Id ? 'Saving…' : 'Save ID'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
