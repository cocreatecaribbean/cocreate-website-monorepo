'use client'

import { useCallback, useEffect, useState } from 'react'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import type { ClientApprovalRecordItem, ProjectRequestItem } from '@/lib/projects/api-types'
import {
  approveCheckpointMessage,
  fetchApprovalHistory,
  fetchOpenApprovals,
  fetchRequestThread,
  navigateToProject,
  sendRequestMessage,
} from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600 } from '@/styles/fonts'
import { CheckCircle2 } from 'lucide-react'

const typeLabel: Record<string, string> = {
  PROGRESS: 'Progress check',
}

export default function ControlCenterApprovalsView() {
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [items, setItems] = useState<ProjectRequestItem[]>([])
  const [history, setHistory] = useState<ClientApprovalRecordItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProjectRequestItem | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [pending, records] = await Promise.all([
      fetchOpenApprovals(),
      fetchApprovalHistory(),
    ])
    setItems(pending)
    setHistory(records)
    setLoading(false)
    return pending
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestId = params.get('requestId')
    if (requestId) {
      setTab('active')
      setSelectedId(requestId)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    void fetchRequestThread(selectedId).then((thread) => {
      if (thread.ok) setSelected(thread.data)
    })
  }, [selectedId])

  const refreshSelected = async () => {
    const pending = await load()
    if (selectedId) {
      const thread = await fetchRequestThread(selectedId)
      if (thread.ok) setSelected(thread.data)
    } else if (pending.length > 0) {
      setSelectedId(pending[0]!.id)
    }
  }

  if (loading) {
    return <p className="text-sm text-app-muted">Loading approvals…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-chambray/10 pb-2">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'active'
              ? 'bg-sanmarino/15 text-chambray'
              : 'text-app-muted hover:bg-chambray/5'
          }`}
        >
          Awaiting your approval
          {items.length > 0 ? ` (${items.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'history'
              ? 'bg-sanmarino/15 text-chambray'
              : 'text-app-muted hover:bg-chambray/5'
          }`}
        >
          History
          {history.length > 0 ? ` (${history.length})` : ''}
        </button>
      </div>

      {tab === 'history' ? (
        history.length === 0 ? (
          <section className="portal-glass-card p-8 text-center">
            <p className="text-sm text-app-muted">No approvals recorded yet.</p>
          </section>
        ) : (
          <ul className="portal-glass-card divide-y divide-chambray/6 overflow-hidden">
            {history.map((record) => (
              <li key={record.id} className="px-4 py-4">
                <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                  {record.title}
                </p>
                <p className="mt-1 text-xs text-app-muted">
                  {record.projectTitle ?? 'Project'} ·{' '}
                  {new Date(record.approvedAt).toLocaleString()}
                  {record.targetPhase
                    ? ` · ${record.targetPhase.replace(/_/g, ' ').toLowerCase()}`
                    : ''}
                </p>
                {record.summary ? (
                  <p className="mt-2 text-sm text-app-muted line-clamp-2">{record.summary}</p>
                ) : null}
                <button
                  type="button"
                  className="mt-3 text-xs text-sanmarino underline underline-offset-2"
                  onClick={() => navigateToProject(record.projectId)}
                >
                  View project
                </button>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <section className="portal-glass-card p-8 text-center">
          <p className="text-sm text-app-muted">Nothing waiting on your approval right now.</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <ul className="portal-glass-card divide-y divide-chambray/6 overflow-hidden">
            {items.map((item) => {
              const active = selectedId === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                      active ? 'bg-sanmarino/10' : 'hover:bg-chambray/5'
                    }`}
                  >
                    <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-sanmarino">
                      {typeLabel[item.type] ?? item.type}
                      {item.projectTitle ? ` · ${item.projectTitle}` : ''}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>

          {selected ? (
            <section className="portal-glass-card p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-casablanca/20 text-chambray">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className={`text-lg text-chambray ${bricolage_grot600.className}`}>
                    {selected.title}
                  </p>
                  <p className="text-sm text-app-muted">{selected.description}</p>
                </div>
              </div>
              <RequestMessageThread
                request={selected}
                viewerRole="CLIENT"
                onSendMessage={async (body) => {
                  const result = await sendRequestMessage(selected.id, body)
                  if (result.ok) await refreshSelected()
                  return { ok: result.ok, message: result.ok ? undefined : result.message }
                }}
                onApproveCheckpoint={async (messageId) => {
                  const result = await approveCheckpointMessage(selected.id, messageId)
                  if (result.ok) await refreshSelected()
                  return { ok: result.ok, message: result.ok ? undefined : result.message }
                }}
              />
            </section>
          ) : (
            <p className="text-sm text-app-muted">Select an item to review and approve.</p>
          )}
        </div>
      )}
    </div>
  )
}
