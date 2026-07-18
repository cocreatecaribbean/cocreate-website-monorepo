'use client'

import { useMemo, useState } from 'react'
import { useAdminSession } from '@/components/admin-session-provider'
import RequestMessageThread from '@/components/request-message-thread'
import ResizableAdminThreadSurface from '@/components/resizable-admin-thread-surface'
import MarkInboxReadOnView from '@/components/mark-inbox-read-on-view'
import ThreadSummaryExport from '@cocreate/app-ui/thread-summary-export'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  downloadAdminProjectThreadSummaryPdf,
  generateAdminProjectThreadSummary,
} from '@/lib/api/mutations/thread-summary'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import type { ClientProjectSummary, ProjectRequestItem } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'

export function findProjectThread(
  project: ClientProjectSummary,
  type: ProjectRequestItem['type'],
) {
  return project.requests?.find((r) => r.type === type) ?? null
}

export function tabForThreadType(
  type: ProjectRequestItem['type'],
): 'onboarding' | 'progress' | 'overview' {
  if (type === 'ONBOARDING') return 'onboarding'
  if (type === 'PROGRESS') return 'progress'
  return 'overview'
}

export function formatPhaseLabel(phase: string): string {
  return phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ProjectThreadPanel({
  title,
  subtitle,
  request,
  readOnly,
  organizationId,
  markReadEnabled,
  loadMessages = true,
  parentOwnsMessages = false,
  liveMessages,
  liveMessagesLoading = false,
  onInboxMarked,
  onSendMessage,
  onThreadUpdate,
  cancellationResolve,
}: {
  title: string
  subtitle: string
  request: ProjectRequestItem
  readOnly?: boolean
  organizationId: string
  markReadEnabled?: boolean
  loadMessages?: boolean
  parentOwnsMessages?: boolean
  liveMessages?: import('@/lib/projects/types').ProjectRequestMessage[]
  liveMessagesLoading?: boolean
  onInboxMarked?: () => void
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string; data?: import('@/lib/projects/types').ProjectRequestMessage }>
  onThreadUpdate?: () => void
  cancellationResolve?: (payload: {
    outcome: string
    feeAmount?: number
    feeNotes?: string
    message?: string
  }) => Promise<void>
}) {
  const { session } = useAdminSession()
  const currentUserId = session?.mode === 'user' ? session.userId : null
  const [threadLatestMessageId, setThreadLatestMessageId] = useState<string | null>(null)
  const latestMessageId = useMemo(() => {
    if (liveMessages?.length) {
      return liveMessages[liveMessages.length - 1]!.id
    }
    return threadLatestMessageId
  }, [liveMessages, threadLatestMessageId])

  return (
    <ResizableAdminThreadSurface
      storageKey={`admin-thread-surface:${request.id}`}
      className="admin-glass-card admin-thread-surface max-md:max-w-none"
      unsizedClassName="w-full max-w-2xl max-md:max-w-none"
    >
      <section id={`thread-panel-${request.id}`} className="flex min-h-0 flex-1 flex-col">
        <div className="admin-thread-surface-header shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className={`text-chambray ${bricolage_grot600.className}`}>{title}</p>
              <p className="mt-1 text-xs text-app-muted">{subtitle}</p>
            </div>
            <ThreadSummaryExport
              triggerClassName="admin-btn-ghost shrink-0 px-3 py-1.5 text-xs"
              panelClassName="admin-glass-card"
              primaryButtonClassName="admin-btn-primary px-4 py-2 text-sm"
              ghostButtonClassName="admin-btn-ghost px-4 py-2 text-sm"
              fetchAttachmentDownloadUrl={fetchAttachmentDownloadUrl}
              onGenerate={(options) =>
                generateAdminProjectThreadSummary(request.id, options)
              }
              onExportPdf={(options) =>
                downloadAdminProjectThreadSummaryPdf(request.id, options)
              }
            />
          </div>
        </div>
        <div className="mt-0 flex min-h-0 flex-1 flex-col md:mt-4">
          {markReadEnabled ? (
            <MarkInboxReadOnView
              organizationId={organizationId}
              requestId={request.id}
              enabled
              latestMessageId={latestMessageId}
              onMarked={onInboxMarked}
            />
          ) : null}
          <RequestMessageThread
            key={request.id}
            request={request}
            loadMessages={loadMessages}
            parentOwnsMessages={parentOwnsMessages}
            liveMessages={liveMessages}
            liveMessagesLoading={liveMessagesLoading}
            viewerRole="ADMIN"
            currentUserId={currentUserId}
            readOnly={readOnly}
            onSendMessage={onSendMessage}
            onThreadUpdate={onThreadUpdate}
            onLatestMessageIdChange={
              markReadEnabled ? setThreadLatestMessageId : undefined
            }
            invalidateQueryKeys={[adminQueryKeys.requests.messages(request.id)]}
          />
          {cancellationResolve &&
          request.type === 'CANCELLATION' &&
          !['RESOLVED', 'REJECTED'].includes(request.status) ? (
            <CancellationResolveForm onResolve={cancellationResolve} />
          ) : null}
        </div>
      </section>
    </ResizableAdminThreadSurface>
  )
}

export function CancellationResolveForm({
  onResolve,
}: {
  onResolve: (payload: {
    outcome: string
    feeAmount?: number
    feeNotes?: string
    message?: string
  }) => Promise<void>
}) {
  const [outcome, setOutcome] = useState('APPROVED_NO_FEE')
  const [feeAmount, setFeeAmount] = useState('')
  const [feeNotes, setFeeNotes] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-red-200/50 bg-red-50/30 p-4">
      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>Resolve cancellation</p>
      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="admin-input w-full"
      >
        <option value="APPROVED_NO_FEE">Approve cancellation (no fee)</option>
        <option value="APPROVED_WITH_FEE">Approve cancellation (with fee)</option>
        <option value="DENIED">Deny cancellation</option>
      </select>
      {outcome === 'APPROVED_WITH_FEE' ? (
        <input
          type="number"
          min={0}
          step="0.01"
          value={feeAmount}
          onChange={(e) => setFeeAmount(e.target.value)}
          placeholder="Fee amount"
          className="admin-input w-full"
        />
      ) : null}
      <input
        type="text"
        value={feeNotes}
        onChange={(e) => setFeeNotes(e.target.value)}
        placeholder="Fee notes (optional)"
        className="admin-input w-full"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to client"
        rows={2}
        className="admin-textarea w-full resize-y"
      />
      <button
        type="button"
        className="admin-btn-primary text-sm"
        onClick={() =>
          void onResolve({
            outcome,
            feeAmount: feeAmount ? Number(feeAmount) : undefined,
            feeNotes: feeNotes || undefined,
            message: message || undefined,
          })
        }
      >
        Send resolution
      </button>
    </div>
  )
}
