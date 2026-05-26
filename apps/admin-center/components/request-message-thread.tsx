'use client'

import { FormEvent, useState } from 'react'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'
import { formatActorWithTitle } from '@/lib/projects/project-display'
import { bricolage_grot600 } from '@/styles/fonts'

type RequestMessageThreadProps = {
  request: ProjectRequestItem
  viewerRole: 'ADMIN' | 'CLIENT'
  onSendMessage: (body: string) => Promise<{ ok: boolean; message?: string }>
  onResolve?: (status: 'RESOLVED' | 'REJECTED') => Promise<void>
  showResolveActions?: boolean
}

function messageAuthorLabel(
  msg: ProjectRequestMessage,
  isMine: boolean,
): string {
  if (isMine) return 'You'
  if (msg.authorRole === 'ADMIN') {
    return (
      formatActorWithTitle(
        msg.authorDisplayName,
        msg.authorJobTitle,
        msg.authorEmail,
      ) ?? 'CoCreate team'
    )
  }
  return (
    formatActorWithTitle(msg.authorDisplayName, null, msg.authorEmail) ?? 'Client'
  )
}

export default function RequestMessageThread({
  request,
  viewerRole,
  onSendMessage,
  onResolve,
  showResolveActions = false,
}: RequestMessageThreadProps) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messages =
    request.messages && request.messages.length > 0
      ? request.messages
      : request.description
        ? [
            {
              id: 'initial',
              requestId: request.id,
              authorUserId: '',
              authorEmail: null,
              authorRole: (request.type === 'ADMIN_REVIEW' ? 'ADMIN' : 'CLIENT') as
                | 'ADMIN'
                | 'CLIENT',
              body: request.description,
              createdAt: request.createdAt,
            },
          ]
        : []
  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(request.status)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setError(null)
    const result = await onSendMessage(reply.trim())
    if (!result.ok) {
      setError(result.message ?? 'Could not send message')
    } else {
      setReply('')
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-chambray/8 bg-white/40 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          messages.map((msg: ProjectRequestMessage) => {
            const isMine =
              (viewerRole === 'ADMIN' && msg.authorRole === 'ADMIN') ||
              (viewerRole === 'CLIENT' && msg.authorRole === 'CLIENT')
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <p className="text-[0.65rem] font-medium text-slate-500">
                  {messageAuthorLabel(msg, isMine)}
                  {msg.authorEmail && !isMine && msg.authorDisplayName !== msg.authorEmail
                    ? ` (${msg.authorEmail})`
                    : ''}{' '}
                  ·{' '}
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
                <p
                  className={`mt-1 max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? 'bg-sanmarino/15 text-chambray'
                      : 'bg-chambray/8 text-slate-800'
                  } ${bricolage_grot600.className}`}
                >
                  {msg.body}
                </p>
              </div>
            )
          })
        )}
      </div>

      {!isClosed ? (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={
              viewerRole === 'CLIENT'
                ? 'Write your response to CoCreate…'
                : 'Follow up with the client…'
            }
            rows={3}
            className="admin-input w-full resize-y"
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={sending} className="admin-btn-primary text-sm">
              {sending ? 'Sending…' : 'Send message'}
            </button>
            {showResolveActions && onResolve ? (
              <>
                <button
                  type="button"
                  onClick={() => void onResolve('RESOLVED')}
                  className="admin-btn-ghost text-sm"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={() => void onResolve('REJECTED')}
                  className="admin-btn-ghost text-sm"
                >
                  Reject
                </button>
              </>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">This conversation is closed ({request.status}).</p>
      )}
    </div>
  )
}
