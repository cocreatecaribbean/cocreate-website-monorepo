'use client'

import { useEffect, useState } from 'react'
import { bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

type PromoteToAdminDialogProps = {
  open: boolean
  memberEmail: string
  onConfirm: () => void
  onCancel: () => void
  confirming?: boolean
}

export default function PromoteToAdminDialog({
  open,
  memberEmail,
  onConfirm,
  onCancel,
  confirming = false,
}: PromoteToAdminDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-chambray/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-admin-title"
        className="admin-glass-card w-full max-w-md p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="promote-admin-title"
          className={`text-lg text-chambray ${bricolage_grot600.className}`}
        >
          Promote to Admin?
        </h2>
        <p className={`mt-2 text-sm text-app-muted ${bricolage_grot500.className}`}>
          Promoting <span className="font-medium text-chambray">{memberEmail}</span> to Admin
          grants access to all projects and the right to invite teammates.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm text-app-muted">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5"
          />
          <span>I understand this person will have full organization admin access.</span>
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className="admin-btn-ghost text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={!acknowledged || confirming}
            onClick={onConfirm}
            className="admin-btn-primary text-sm"
          >
            {confirming ? 'Promoting…' : 'Promote to Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}
