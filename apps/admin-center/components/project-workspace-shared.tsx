'use client'

import { useState } from 'react'
import { useAdminSession } from '@/components/admin-session-provider'
import RequestMessageThread, {
  type CheckpointComposeConfig,
} from '@/components/request-message-thread'
import MarkInboxReadOnView from '@/components/mark-inbox-read-on-view'
import ThreadSummaryExport from '@cocreate/app-ui/thread-summary-export'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  downloadAdminProjectThreadSummaryPdf,
  generateAdminProjectThreadSummary,
} from '@/lib/api/mutations/thread-summary'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-project-files'
import type { ClientProjectSummary, ProjectRequestItem } from '@/lib/projects/types'
import type { ThreadApprovalItem } from '@/lib/projects/thread-approval-items'
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

export function ProgressCheckPanel({
  project,
  clientName,
  title,
  body,
  reviewUrl,
  phase,
  selectedFiles,
  submitting,
  onTitleChange,
  onBodyChange,
  onReviewUrlChange,
  onFilesChange,
  onPhaseChange,
  onSubmit,
  onCancel,
}: {
  project: ClientProjectSummary
  clientName: string
  title: string
  body: string
  reviewUrl: string
  phase: string
  selectedFiles: FileList | null
  submitting: boolean
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onReviewUrlChange: (value: string) => void
  onFilesChange: (files: FileList | null) => void
  onPhaseChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <section
      id={`progress-check-${project.id}`}
      className="rounded-xl border border-casablanca/35 bg-linear-to-br from-casablanca/10 via-white/40 to-sanmarino/5 p-5 ring-1 ring-casablanca/20 dark:from-casablanca/10 dark:via-chambray/20 dark:to-sanmarino/10 dark:ring-casablanca/25"
    >
      <p className="admin-eyebrow">Progress check for</p>
      <h3 className={`mt-1 text-lg text-chambray ${bricolage_grot600.className}`}>
        {project.title}
      </h3>
      <p className="mt-1 text-sm text-app-muted">
        {clientName} · Phase: {formatPhaseLabel(project.phase)}
      </p>
      {project.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-app-muted">{project.description}</p>
      ) : null}
      <p className="mt-4 text-sm text-app-muted">
        The client can approve or reply with changes. New checks replace any previous pending
        approval on this project.
      </p>
      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title (e.g. Approve phase 2 deliverables)"
          className="admin-input w-full"
        />
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="What should the client review?"
          rows={4}
          className="admin-textarea w-full resize-y"
        />
        <input
          type="url"
          value={reviewUrl}
          onChange={(e) => onReviewUrlChange(e.target.value)}
          placeholder="Review link (optional) — website, video, etc."
          className="admin-input w-full"
        />
        <div>
          <p className="text-sm text-app-muted">Attachments (optional)</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="admin-btn-ghost cursor-pointer text-sm">
              Choose files
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={(e) => onFilesChange(e.target.files)}
                className="sr-only"
              />
            </label>
            {selectedFiles && selectedFiles.length > 0 ? (
              <span className="text-sm text-app-muted">
                {Array.from(selectedFiles)
                  .map((file) => file.name)
                  .join(', ')}
              </span>
            ) : (
              <span className="text-sm text-app-muted">No files selected</span>
            )}
          </div>
        </div>
        <select
          value={phase}
          onChange={(e) => onPhaseChange(e.target.value)}
          className="admin-input w-full"
        >
          <option value="">No phase change</option>
          <option value="CLIENT_REVIEW">On approve → Client review</option>
          <option value="READY_FOR_DELIVERY">On approve → Ready for delivery</option>
          <option value="DELIVERED">On approve → Delivered</option>
        </select>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void onSubmit()}
            className="admin-btn-primary text-sm"
          >
            {submitting ? 'Sending…' : 'Send to client'}
          </button>
          <button type="button" onClick={onCancel} className="admin-btn-ghost text-sm">
            Cancel
          </button>
        </div>
      </div>
    </section>
  )
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
  checkpointCompose,
  threadApprovalItems,
  onApprovalReply,
  onApprovalUploadRevision,
  approvalInvalidateQueryKeys,
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
  checkpointCompose?: CheckpointComposeConfig
  threadApprovalItems?: ThreadApprovalItem[]
  onApprovalReply?: (
    approvalItemId: string,
    body: string,
  ) => Promise<{ ok: boolean; message?: string }>
  onApprovalUploadRevision?: (
    approvalItemId: string,
    file: File,
    note?: string,
  ) => Promise<{ ok: boolean; message?: string }>
  approvalInvalidateQueryKeys?: import('@tanstack/react-query').QueryKey[]
}) {
  const { session } = useAdminSession()
  const currentUserId = session?.mode === 'user' ? session.userId : null

  return (
    <section
      id={`thread-panel-${request.id}`}
      className="admin-glass-card admin-thread-surface w-full max-w-2xl max-md:max-w-none"
    >
      <div className="admin-thread-surface-header">
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
      <div className="mt-0 min-h-0 flex-1 md:mt-4">
        {markReadEnabled ? (
          <MarkInboxReadOnView
            organizationId={organizationId}
            requestId={request.id}
            enabled
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
          invalidateQueryKeys={[
            adminQueryKeys.requests.messages(request.id),
            ...(approvalInvalidateQueryKeys ?? []),
          ]}
          checkpointCompose={checkpointCompose}
          threadApprovalItems={threadApprovalItems}
          onApprovalReply={onApprovalReply}
          onApprovalUploadRevision={onApprovalUploadRevision}
        />
        {cancellationResolve &&
        request.type === 'CANCELLATION' &&
        !['RESOLVED', 'REJECTED'].includes(request.status) ? (
          <CancellationResolveForm onResolve={cancellationResolve} />
        ) : null}
      </div>
    </section>
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
