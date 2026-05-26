'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'
import AdminToast from '@/components/admin-toast'

type JobTitleOption = {
  id: string
  label: string
  sortOrder: number
  isActive: boolean
}

type ToastState = { message: string; variant: 'success' | 'error' } | null

export default function AgencyProfileOptionsManager() {
  const [options, setOptions] = useState<JobTitleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchAdminBff<JobTitleOption[]>('/api/settings/profile-options')
      setOptions(Array.isArray(rows) ? rows.filter((o) => o.isActive) : [])
    } catch (err) {
      showError(err, 'Could not load job titles')
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addOption = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newLabel.trim()
    if (!trimmed) return

    setAdding(true)
    setToast(null)
    try {
      await fetchAdminBff('/api/settings/profile-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed }),
      })
      setNewLabel('')
      setToast({ message: 'Job title added', variant: 'success' })
      await load()
    } catch (err) {
      showError(err, 'Could not add job title')
    } finally {
      setAdding(false)
    }
  }

  const deleteOption = async (id: string, label: string) => {
    if (!window.confirm(`Remove "${label}" from the list?`)) return

    setDeletingId(id)
    setToast(null)
    try {
      const result = await fetchAdminBff<{
        ok?: boolean
        removed?: boolean
        deactivated?: boolean
      }>(`/api/settings/profile-options/${id}`, { method: 'DELETE' })
      if (result.deactivated) {
        setToast({
          message:
            'Hidden from selection — an admin profile still uses this title.',
          variant: 'success',
        })
      } else {
        setToast({ message: 'Job title deleted', variant: 'success' })
      }
      await load()
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

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

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
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newLabel.trim()}
            className="admin-btn-primary text-sm"
          >
            {adding ? 'Adding…' : 'Add'}
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
