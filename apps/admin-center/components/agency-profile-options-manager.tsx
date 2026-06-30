'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AdminApiFetchError } from '@/lib/admin-api-fetch'
import {
  useCreateProfileOptionMutation,
  useDeleteProfileOptionMutation,
} from '@/lib/api/mutations/profile'
import { useAgencyProfileOptionsQuery } from '@/lib/api/queries/profile'
import { bricolage_grot600 } from '@/styles/fonts'
import AdminToast from '@/components/admin-toast'
import type { JobTitleOption } from '@/lib/projects/api-types'

type ToastState = { message: string; variant: 'success' | 'error' } | null

export default function AgencyProfileOptionsManager() {
  const { data: optionsRaw = [], isLoading } = useAgencyProfileOptionsQuery()
  const createOptionMutation = useCreateProfileOptionMutation()
  const deleteOptionMutation = useDeleteProfileOptionMutation()

  const options = useMemo(
    () => (Array.isArray(optionsRaw) ? optionsRaw.filter((o) => o.isActive) : []),
    [optionsRaw],
  )

  const [newLabel, setNewLabel] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const showError = (err: unknown, fallback: string) => {
    const message =
      err instanceof AdminApiFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : fallback
    setToast({ message, variant: 'error' })
  }

  const addOption = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newLabel.trim()
    if (!trimmed) return

    setToast(null)
    try {
      await createOptionMutation.mutateAsync({ label: trimmed })
      setNewLabel('')
      setToast({ message: 'Job title added', variant: 'success' })
    } catch (err) {
      showError(err, 'Could not add job title')
    }
  }

  const deleteOption = async (id: string, label: string) => {
    if (!window.confirm(`Remove "${label}" from the list?`)) return

    setDeletingId(id)
    setToast(null)
    try {
      const result = await deleteOptionMutation.mutateAsync(id)
      if (result.deactivated) {
        setToast({
          message:
            'Hidden from selection — an admin profile still uses this title.',
          variant: 'success',
        })
      } else {
        setToast({ message: 'Job title deleted', variant: 'success' })
      }
    } catch (err) {
      showError(err, 'Could not remove job title')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {toast ? (
        <AdminToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      <section className="admin-surface space-y-4 p-6">
        <p className={`text-lg text-chambray ${bricolage_grot600.className}`}>Job titles</p>
        <p className="text-sm text-slate-500">
          Admins can select one or more titles on their profile. Clients see them next to the
          admin&apos;s name on project actions.
        </p>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => void addOption(e)}>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New job title"
            className="admin-input min-w-[12rem] flex-1"
            disabled={createOptionMutation.isPending}
          />
          <button
            type="submit"
            disabled={createOptionMutation.isPending || !newLabel.trim()}
            className="admin-btn-primary text-sm"
          >
            {createOptionMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>
        <OptionList
          items={options}
          deletingId={deletingId}
          onDelete={(id, label) => void deleteOption(id, label)}
        />
      </section>
    </div>
  )
}

function OptionList({
  items,
  deletingId,
  onDelete,
}: {
  items: JobTitleOption[]
  deletingId: string | null
  onDelete: (id: string, label: string) => void
}) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No job titles yet. Add one above.</p>
  }
  return (
    <ul className="divide-y divide-chambray/6">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 py-3 text-sm text-chambray"
        >
          <span>{item.label}</span>
          <button
            type="button"
            disabled={deletingId === item.id}
            onClick={() => onDelete(item.id, item.label)}
            className="admin-btn-ghost text-xs text-red-700/90 hover:text-red-800"
          >
            {deletingId === item.id ? 'Removing…' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  )
}
