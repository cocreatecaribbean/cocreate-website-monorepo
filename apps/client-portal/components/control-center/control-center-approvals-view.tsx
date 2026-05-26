'use client'

import { useCallback, useEffect, useState } from 'react'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import type { ProjectRequestItem } from '@/lib/projects/api-types'
import {
  fetchOpenApprovals,
  fetchRequestThread,
  sendRequestMessage,
} from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600 } from '@/styles/fonts'
import { CheckCircle2 } from 'lucide-react'

const typeLabel: Record<string, string> = {
  ADMIN_REVIEW: 'Review from CoCreate',
}

export default function ControlCenterApprovalsView() {
  const [items, setItems] = useState<ProjectRequestItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProjectRequestItem | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const list = await fetchOpenApprovals()
    setItems(list)
    setLoading(false)
    return list
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestId = params.get('requestId')
    if (requestId) setSelectedId(requestId)
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
    const list = await load()
    if (selectedId) {
      const thread = await fetchRequestThread(selectedId)
      if (thread.ok) setSelected(thread.data)
    } else if (list.length > 0 && !selectedId) {
      setSelectedId(list[0].id)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading approvals…</p>
  }

  if (items.length === 0) {
    return (
      <section className="portal-glass-card p-8 text-center">
        <p className="text-sm text-slate-500">Nothing waiting on you right now.</p>
      </section>
    )
  }

  return (
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
                  {item.messageCount ? ` · ${item.messageCount} messages` : ''}
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
              <p className="text-sm text-slate-600">{selected.description}</p>
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
          />
        </section>
      ) : (
        <p className="text-sm text-slate-500">Select a request to view the conversation.</p>
      )}
    </div>
  )
}
