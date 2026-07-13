'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowUpRight, Radio, UserCheck, UserPlus, Users } from 'lucide-react'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
} from '@/lib/admin-api-fetch'
import { useClientsQuery } from '@/lib/api/queries/clients'
import type { ClientOrganizationRosterItem } from '@/lib/projects/types'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

const EMPTY_CLIENTS: ClientOrganizationRosterItem[] = []

const statusLabel: Record<string, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
}

function ClientLogoTile({ client }: { client: ClientOrganizationRosterItem }) {
  if (client.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={client.logoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-2xl object-contain ring-1 ring-chambray/10"
      />
    )
  }

  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sanmarino/20 to-chambray/10 text-sm font-semibold text-chambray ring-1 ring-sanmarino/15">
      {client.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabel[status] ?? status
  const isActive = status === 'ACTIVE'
  const isSuspended = status === 'SUSPENDED'
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        isSuspended
          ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
          : isActive
            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200'
      }`}
    >
      {label}
    </span>
  )
}

function SocialListeningChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sanmarino/10 px-2 py-0.5 text-xs font-medium text-sanmarino ring-1 ring-sanmarino/15">
      <Radio className="h-3 w-3" aria-hidden />
      Social Listening
    </span>
  )
}

function ClientsRosterSummary({ clients }: { clients: ClientOrganizationRosterItem[] }) {
  const counts = useMemo(() => {
    let active = 0
    let invited = 0
    let suspended = 0
    for (const client of clients) {
      const status = client.primaryContact?.status
      if (status === 'ACTIVE') active += 1
      else if (status === 'INVITED') invited += 1
      else if (status === 'SUSPENDED') suspended += 1
    }
    return { total: clients.length, active, invited, suspended }
  }, [clients])

  const stats = [
    {
      label: 'Organizations',
      value: counts.total,
      icon: Users,
      accent: 'bg-sanmarino/10 text-sanmarino',
      accentBar: 'from-sanmarino to-chambray',
    },
    {
      label: 'Active',
      value: counts.active,
      icon: UserCheck,
      accent: 'bg-emerald-500/10 text-emerald-700',
      accentBar: 'from-emerald-400 to-sanmarino',
    },
    {
      label: 'Invited',
      value: counts.invited,
      icon: UserPlus,
      accent: 'bg-amber-500/10 text-amber-800',
      accentBar: 'from-casablanca to-sanmarino',
    },
    {
      label: 'Suspended',
      value: counts.suspended,
      icon: Users,
      accent: 'bg-red-500/10 text-red-700',
      accentBar: 'from-red-400 to-chambray',
    },
  ] as const

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <article
            key={stat.label}
            className="admin-glass-kpi relative flex min-h-[5.5rem] flex-col justify-between p-4"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 rounded-t-[var(--radius-card)] bg-linear-to-r ${stat.accentBar}`}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2 pt-1">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-app-muted">
                  {stat.label}
                </p>
                <p
                  className={`mt-1.5 text-xl tabular-nums text-chambray sm:text-2xl ${bricolage_grot700.className}`}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`shrink-0 rounded-xl p-2 ${stat.accent}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default function ClientsListView() {
  const { data, isLoading, error: queryError, isError } = useClientsQuery()
  const clients = data ?? EMPTY_CLIENTS

  const loadError = isError
    ? queryError instanceof AdminApiFetchError
      ? `${queryError.message} — ${adminFetchErrorHint(queryError.code)}`
      : queryError instanceof Error
        ? queryError.message
        : 'Could not load clients.'
    : null

  if (isLoading) {
    return <p className="text-sm text-app-muted">Loading clients…</p>
  }

  if (loadError) {
    return <p className="admin-alert-error text-sm">{loadError}</p>
  }

  if (clients.length === 0) {
    return (
      <div className="admin-glass-card p-8 text-center">
        <p className="text-sm text-app-muted">No clients onboarded yet.</p>
        <p className="mt-2 text-sm text-app-muted">
          Use <span className="font-medium text-chambray">Invite client</span> to add your
          first organization.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ClientsRosterSummary clients={clients} />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => {
          const status = client.primaryContact?.status
          return (
            <li key={client.id} className="min-h-0">
              <Link
                href={`/clients/${client.id}`}
                className="group admin-action-tile flex h-full min-h-[10.5rem] flex-col items-stretch gap-4 bg-linear-to-br from-white/85 to-sanmarino/8 p-5 dark:from-sanmarino/25 dark:via-chambray/15 dark:to-chambray/10 dark:ring-1 dark:ring-inset dark:ring-sanmarino/20"
              >
                <div className="flex items-start gap-3">
                  <ClientLogoTile client={client} />
                  <div className="min-w-0 flex-1">
                    <p className={`wrap-break-word text-base text-chambray ${bricolage_grot600.className}`}>
                      {client.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-app-muted">
                      {client.primaryContact?.email ?? 'No contact'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {status ? <StatusBadge status={status} /> : null}
                  {client.isSocialListeningSubscriber ? <SocialListeningChip /> : null}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-chambray/8 pt-3 text-xs text-sanmarino dark:border-white/10">
                  <span className="font-medium">Manage organization</span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
