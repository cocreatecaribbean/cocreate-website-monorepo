'use client'

import type { ReactNode } from 'react'

export type FileApprovalState = {
  reviewRequested?: boolean
  approvedAt?: string | null
  changesRequestedAt?: string | null
}

export function fileApprovalStatus(
  file: FileApprovalState,
): 'approved' | 'changes_requested' | 'review_requested' | null {
  if (file.approvedAt) return 'approved'
  if (file.changesRequestedAt) return 'changes_requested'
  if (file.reviewRequested) return 'review_requested'
  return null
}

export function FileApprovalStatusPill({
  file,
  className = '',
}: {
  file: FileApprovalState
  className?: string
}) {
  const status = fileApprovalStatus(file)
  if (!status || status === 'review_requested') return null

  if (status === 'approved') {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200 ${className}`.trim()}
      >
        Approved
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-500/25 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-100 ${className}`.trim()}
    >
      Changes requested
    </span>
  )
}

export function FileReviewRequestCallout({
  onApprove,
  disabled = false,
  className = '',
}: {
  onApprove?: () => void | Promise<void>
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-sanmarino/20 bg-sanmarino/5 px-3 py-2.5 dark:border-sanmarino/30 dark:bg-sanmarino/10 ${className}`.trim()}
    >
      <p className="text-xs font-semibold text-chambray dark:text-white">Review requested</p>
      <p className="mt-0.5 text-xs text-app-muted">
        Tap <span className="font-medium text-chambray dark:text-white">Good to go</span> to
        approve this version, or reply with notes.
      </p>
      {onApprove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onApprove()}
          className="mt-2 inline-flex min-h-8 items-center rounded-lg bg-sanmarino px-3 text-xs font-medium text-white disabled:opacity-60"
        >
          🚀 Good to go
        </button>
      ) : null}
    </div>
  )
}

export function AttachmentApprovalBadgeCluster({
  file,
  reactionCluster,
}: {
  file: FileApprovalState
  reactionCluster?: ReactNode
}) {
  const pill = <FileApprovalStatusPill file={file} />
  if (!pill && !reactionCluster) return null
  return (
    <span className="inline-flex flex-col items-end gap-1">
      {pill}
      {reactionCluster}
    </span>
  )
}
