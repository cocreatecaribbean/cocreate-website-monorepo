'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MarkApprovalsReadOnView from '@/components/control-center/mark-approvals-read-on-view'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import type { ClientApprovalRecordItem, ProjectRequestItem } from '@/lib/projects/api-types'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import {
  approveCheckpointMessage,
  fetchApprovalHistory,
  fetchOpenApprovals,
  fetchRequestThread,
  sendRequestMessage,
} from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600 } from '@/styles/fonts'
import { CheckCircle2 } from 'lucide-react'

const typeLabel: Record<string, string> = {
  PROGRESS: 'Progress check',
}

function mergeThreadWithListItem(
  thread: ProjectRequestItem,
  listItem: ProjectRequestItem | undefined,
): ProjectRequestItem {
  if (!listItem?.attachments?.length || thread.attachments?.length) {
    return thread
  }
  return { ...thread, attachments: listItem.attachments }
}

export default function ControlCenterApprovalsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const deepLinkRequestId = searchParams.get('requestId')

  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [items, setItems] = useState<ProjectRequestItem[]>([])
  const [history, setHistory] = useState<ClientApprovalRecordItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkRequestId)
  const [selected, setSelected] = useState<ProjectRequestItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)

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
    if (deepLinkRequestId) {
      setTab('active')
      setSelectedId(deepLinkRequestId)
    }
  }, [deepLinkRequestId])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      setThreadLoading(false)
      return
    }

    setThreadLoading(true)
    let cancelled = false

    void (async () => {
      const optimistic = items.find((item) => item.id === selectedId)
      if (optimistic) {
        setSelected(optimistic)
      }

      const thread = await fetchRequestThread(selectedId)
      if (cancelled) return
      if (thread.ok) {
        setSelected(mergeThreadWithListItem(thread.data, optimistic))
      } else if (!optimistic) {
        setSelected(null)
      }
      setThreadLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [selectedId, items])

  const refreshSelectedThreadOnly = useCallback(async () => {
    if (!selectedId) return
    const listItem = items.find((item) => item.id === selectedId)
    const thread = await fetchRequestThread(selectedId)
    if (thread.ok) {
      setSelected(mergeThreadWithListItem(thread.data, listItem))
    }
  }, [selectedId, items])

  const refreshSelected = async () => {
    const pending = await load()
    if (selectedId) {
      const listItem = pending.find((item) => item.id === selectedId)
      const thread = await fetchRequestThread(selectedId)
      if (thread.ok) {
        setSelected(mergeThreadWithListItem(thread.data, listItem))
      }
    } else if (pending.length > 0) {
      setSelectedId(pending[0]!.id)
    }
  }

  const awaitingDeepLink = Boolean(selectedId && (loading || threadLoading))
  const showEmptyActive = !loading && !awaitingDeepLink && items.length === 0
  const detailReady = Boolean(selectedId && selected && selected.id === selectedId)

  if (loading && !selectedId) {
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
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search)
                    params.set(CONTROL_CENTER_VIEW_QUERY, 'projects')
                    params.set('projectId', record.projectId)
                    params.delete('requestId')
                    const query = params.toString()
                    router.push(query ? `${pathname}?${query}` : pathname)
                  }}
                >
                  View project
                </button>
              </li>
            ))}
          </ul>
        )
      ) : awaitingDeepLink && items.length === 0 ? (
        <section className="portal-glass-card space-y-4 p-8 text-center">
          <p className={`text-chambray ${bricolage_grot600.className}`}>Opening approval…</p>
          <p className="text-sm text-app-muted">Loading review details</p>
        </section>
      ) : showEmptyActive ? (
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
                    onClick={() => {
                      setSelectedId(item.id)
                      const params = new URLSearchParams(searchParams.toString())
                      params.set(CONTROL_CENTER_VIEW_QUERY, 'approvals')
                      params.set('requestId', item.id)
                      const query = params.toString()
                      router.replace(query ? `${pathname}?${query}` : pathname, {
                        scroll: false,
                      })
                    }}
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

          {detailReady && selected ? (
            <section className="portal-glass-card p-6">
              <MarkApprovalsReadOnView requestId={selected.id} enabled={!threadLoading} />
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
                onThreadUpdate={() => void refreshSelectedThreadOnly()}
                onSendMessage={async (body, attachmentIds) => {
                  const result = await sendRequestMessage(selected.id, body, attachmentIds)
                  if (result.ok) await refreshSelectedThreadOnly()
                  return { ok: result.ok, message: result.ok ? undefined : result.message }
                }}
                onApproveCheckpoint={async (messageId) => {
                  const result = await approveCheckpointMessage(selected.id, messageId)
                  if (result.ok) {
                    await refreshSelectedThreadOnly()
                    void load()
                  }
                  return { ok: result.ok, message: result.ok ? undefined : result.message }
                }}
              />
            </section>
          ) : selectedId ? (
            <section className="portal-glass-card space-y-4 p-8 text-center">
              <p className={`text-chambray ${bricolage_grot600.className}`}>Opening approval…</p>
              <p className="text-sm text-app-muted">Loading review details</p>
            </section>
          ) : (
            <p className="text-sm text-app-muted">Select an item to review and approve.</p>
          )}
        </div>
      )}
    </div>
  )
}
