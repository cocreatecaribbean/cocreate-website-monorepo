'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, X } from 'lucide-react'
import {
  AdminApiFetchError,
  adminFetchErrorHint,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import {
  createProjectForAdmin,
  fetchOrganizationPortalStatus,
  type CreateProjectForAdminResult,
  type OrganizationPortalStatus,
  type OrganizationPortalUser,
} from '@/lib/projects/fetch-admin-projects'
import { bricolage_grot600 } from '@/styles/fonts'

const INVITE_NEW_VALUE = '__invite_new__'

type ClientRosterOption = {
  id: string
  name: string
  slug: string
}

type RecipientRow = {
  key: string
  selection: string
  newEmail: string
}

type CreateProjectModalProps = {
  open: boolean
  organizationId?: string
  onClose: () => void
  onCreated: (summary: string) => void
}

function newRowKey() {
  return `row-${Math.random().toString(36).slice(2, 9)}`
}

function statusLabel(status: OrganizationPortalUser['status']) {
  return status === 'ACTIVE' ? 'Active' : 'Invite pending'
}

function sortPortalUsers(users: OrganizationPortalUser[]) {
  return [...users].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'ACTIVE' ? -1 : 1
    }
    return a.email.localeCompare(b.email, undefined, { sensitivity: 'base' })
  })
}

function formatPortalSummary(actions: CreateProjectForAdminResult['portalActions']): string {
  const parts = ['Project created.']
  if (actions.notifiedActiveCount > 0) {
    parts.push(
      `Notified ${actions.notifiedActiveCount} active portal user${
        actions.notifiedActiveCount === 1 ? '' : 's'
      }.`,
    )
  }
  if (actions.inviteRemindersSent > 0) {
    parts.push(
      `Invite reminder sent to ${actions.inviteRemindersSent} pending user${
        actions.inviteRemindersSent === 1 ? '' : 's'
      }.`,
    )
  }
  if (actions.newInvitesSent > 0) {
    const emails = actions.invitedEmails.join(', ')
    parts.push(
      `Portal invite sent to ${actions.newInvitesSent} new contact${
        actions.newInvitesSent === 1 ? '' : 's'
      }${emails ? ` (${emails})` : ''}.`,
    )
  }
  return parts.join(' ')
}

function defaultRecipientRows(portal: OrganizationPortalStatus | null): RecipientRow[] {
  const firstUser = sortPortalUsers(portal?.portalUsers ?? [])[0]
  if (firstUser) {
    return [{ key: newRowKey(), selection: firstUser.id, newEmail: '' }]
  }
  return [{ key: newRowKey(), selection: INVITE_NEW_VALUE, newEmail: '' }]
}

export default function CreateProjectModal({
  open,
  organizationId: organizationIdProp,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [mounted, setMounted] = useState(false)
  const [clients, setClients] = useState<ClientRosterOption[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [portalStatus, setPortalStatus] = useState<OrganizationPortalStatus | null>(
    null,
  )
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [recipientRows, setRecipientRows] = useState<RecipientRow[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsClientPicker = organizationIdProp === undefined
  const effectiveOrganizationId =
    organizationIdProp ?? (selectedClientId || undefined)

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [clients],
  )

  const sortedPortalUsers = useMemo(
    () => sortPortalUsers(portalStatus?.portalUsers ?? []),
    [portalStatus],
  )

  const portalUserById = useMemo(() => {
    const map = new Map<string, OrganizationPortalUser>()
    for (const user of sortedPortalUsers) {
      map.set(user.id, user)
    }
    return map
  }, [sortedPortalUsers])

  const chosenUserIds = useMemo(
    () =>
      new Set(
        recipientRows
          .filter((r) => r.selection && r.selection !== INVITE_NEW_VALUE)
          .map((r) => r.selection),
      ),
    [recipientRows],
  )

  const { recipientUserIds, inviteEmails } = useMemo(() => {
    const userIds: string[] = []
    const emails: string[] = []
    for (const row of recipientRows) {
      if (row.selection === INVITE_NEW_VALUE) {
        const email = row.newEmail.trim().toLowerCase()
        if (email) emails.push(email)
      } else if (row.selection) {
        userIds.push(row.selection)
      }
    }
    return {
      recipientUserIds: [...new Set(userIds)],
      inviteEmails: [...new Set(emails)],
    }
  }, [recipientRows])

  const hasValidRecipients = recipientUserIds.length + inviteEmails.length > 0

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, submitting])

  const loadClients = useCallback(async () => {
    setLoadingClients(true)
    try {
      const roster = await fetchAdminBff<ClientRosterOption[]>('/api/clients')
      setClients(roster)
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not load clients'
      setError(message)
    } finally {
      setLoadingClients(false)
    }
  }, [])

  const loadPortalStatus = useCallback(async (orgId: string) => {
    setLoadingPortal(true)
    setError(null)
    try {
      const status = await fetchOrganizationPortalStatus(orgId)
      setPortalStatus(status)
      setRecipientRows(defaultRecipientRows(status))
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not load portal status'
      setError(message)
      setPortalStatus(null)
      setRecipientRows(defaultRecipientRows(null))
    } finally {
      setLoadingPortal(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setPortalStatus(null)
    setRecipientRows([])
    setSelectedClientId('')
    setError(null)

    if (needsClientPicker) {
      void loadClients()
    }
  }, [open, needsClientPicker, loadClients])

  useEffect(() => {
    if (!open || !effectiveOrganizationId) {
      if (!effectiveOrganizationId) {
        setPortalStatus(null)
        setRecipientRows([])
      }
      return
    }
    void loadPortalStatus(effectiveOrganizationId)
  }, [open, effectiveOrganizationId, loadPortalStatus])

  const onClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    setPortalStatus(null)
    setRecipientRows([])
    setError(null)
  }

  const updateRow = (key: string, patch: Partial<RecipientRow>) => {
    setRecipientRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    )
  }

  const addRecipientRow = () => {
    const available = sortedPortalUsers.find((u) => !chosenUserIds.has(u.id))
    setRecipientRows((rows) => [
      ...rows,
      {
        key: newRowKey(),
        selection: available?.id ?? INVITE_NEW_VALUE,
        newEmail: '',
      },
    ])
  }

  const removeRecipientRow = (key: string) => {
    setRecipientRows((rows) => {
      if (rows.length <= 1) return rows
      return rows.filter((row) => row.key !== key)
    })
  }

  const canSubmit =
    Boolean(effectiveOrganizationId) &&
    title.trim().length >= 2 &&
    description.trim().length >= 1 &&
    hasValidRecipients &&
    !loadingPortal &&
    !loadingClients &&
    recipientRows.every((row) => {
      if (row.selection === INVITE_NEW_VALUE) {
        return row.newEmail.trim().length > 0
      }
      return row.selection.length > 0
    })

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!effectiveOrganizationId || !hasValidRecipients) return
    setError(null)
    setSubmitting(true)
    try {
      const result = await createProjectForAdmin(effectiveOrganizationId, {
        title: title.trim(),
        description: description.trim(),
        ...(recipientUserIds.length ? { recipientUserIds } : {}),
        ...(inviteEmails.length ? { inviteEmails } : {}),
      })
      onCreated(formatPortalSummary(result.portalActions))
      onClose()
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? err.status === 409
            ? err.message
            : `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not create project'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || !open) return null

  const projectTitlePreview = title.trim() || 'your new project'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-chambray/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-chambray/10 bg-white p-6 shadow-xl dark:bg-chambray">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="admin-eyebrow">New project</p>
            <h2
              id="create-project-title"
              className={`mt-1 text-xl text-chambray ${bricolage_grot600.className}`}
            >
              Create project
            </h2>
            <p className="mt-1 text-sm text-app-muted">
              The project is onboarded immediately. Choose who should be notified or
              invited to the client portal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-app-muted hover:bg-chambray/8"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingClients ? (
          <p className="mt-4 text-sm text-app-muted">Loading clients…</p>
        ) : null}

        {loadingPortal && effectiveOrganizationId ? (
          <p className="mt-4 text-sm text-app-muted">Loading portal users…</p>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4">
          {needsClientPicker ? (
            <label className="block text-sm">
              <span className="font-medium text-chambray">Client</span>
              <select
                required
                value={selectedClientId}
                onChange={(e) => onClientChange(e.target.value)}
                className="admin-input mt-1 w-full"
                disabled={loadingClients || submitting}
              >
                <option value="">Select a client…</option>
                {sortedClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="font-medium text-chambray">Title</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input mt-1 w-full"
              placeholder="Website redesign"
              disabled={needsClientPicker && !effectiveOrganizationId}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-chambray">Description</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="admin-input mt-1 w-full resize-y"
              placeholder="Goals, scope, and context for the team…"
              disabled={needsClientPicker && !effectiveOrganizationId}
            />
          </label>

          {effectiveOrganizationId && !loadingPortal ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-chambray">Recipients</legend>
              <p className="text-xs text-app-muted">
                Portal users who should be notified or receive an invite link for this
                project.
              </p>
              {recipientRows.map((row, index) => {
                const selectedUser =
                  row.selection !== INVITE_NEW_VALUE
                    ? portalUserById.get(row.selection)
                    : undefined
                const isInviteNew = row.selection === INVITE_NEW_VALUE

                return (
                  <div
                    key={row.key}
                    className="rounded-xl border border-chambray/10 bg-chambray/[0.02] p-3 dark:bg-white/5"
                  >
                    <div className="flex gap-2">
                      <select
                        required
                        value={row.selection}
                        onChange={(e) =>
                          updateRow(row.key, {
                            selection: e.target.value,
                            newEmail: '',
                          })
                        }
                        className="admin-input min-w-0 flex-1 text-sm"
                        disabled={submitting}
                      >
                        <option value="">Select portal user…</option>
                        {sortedPortalUsers.map((user) => (
                          <option
                            key={user.id}
                            value={user.id}
                            disabled={
                              chosenUserIds.has(user.id) && row.selection !== user.id
                            }
                          >
                            {user.email} — {statusLabel(user.status)}
                          </option>
                        ))}
                        <option value={INVITE_NEW_VALUE}>Invite someone new…</option>
                      </select>
                      {recipientRows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeRecipientRow(row.key)}
                          className="admin-btn-ghost shrink-0 px-2 text-red-600"
                          aria-label={`Remove recipient ${index + 1}`}
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    {isInviteNew ? (
                      <input
                        type="email"
                        required
                        value={row.newEmail}
                        onChange={(e) => updateRow(row.key, { newEmail: e.target.value })}
                        className="admin-input mt-2 w-full text-sm"
                        placeholder="client@company.com"
                        disabled={submitting}
                      />
                    ) : null}

                    {selectedUser?.status === 'INVITED' ? (
                      <p className="mt-2 text-xs text-chambray">
                        Invite pending — we&apos;ll send a new sign-in link. They must
                        accept to access the portal and see{' '}
                        <span className="font-medium">{projectTitlePreview}</span>.
                      </p>
                    ) : null}

                    {isInviteNew ? (
                      <p className="mt-2 text-xs text-app-muted">
                        A portal invite will be sent so they can sign in and view{' '}
                        <span className="font-medium text-chambray">
                          {projectTitlePreview}
                        </span>
                        .
                      </p>
                    ) : null}
                  </div>
                )
              })}
              <button
                type="button"
                onClick={addRecipientRow}
                disabled={submitting}
                className="admin-btn-ghost inline-flex items-center gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add recipient
              </button>
            </fieldset>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="admin-btn-ghost text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="admin-btn-primary text-sm"
            >
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
