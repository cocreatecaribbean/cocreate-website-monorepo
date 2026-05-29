'use client'

import { useCallback, useState } from 'react'
import { useAdminSession } from '@/components/admin-session-provider'
import RequestMessageThread from '@/components/request-message-thread'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type { ProjectRequestItem } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'

type TeamReviewPanelProps = {
  projectId: string
  internalRequest: ProjectRequestItem
  readOnly?: boolean
  onThreadUpdate?: () => void
}

export default function TeamReviewPanel({
  projectId: _projectId,
  internalRequest,
  readOnly = false,
  onThreadUpdate,
}: TeamReviewPanelProps) {
  const { session } = useAdminSession()
  const currentUserId = session?.mode === 'user' ? session.userId : null
  const [request, setRequest] = useState(internalRequest)

  const refreshThread = useCallback(async () => {
    const updated = await fetchAdminBff<ProjectRequestItem>(
      `/api/project-requests/${internalRequest.id}`,
    )
    setRequest(updated)
    onThreadUpdate?.()
  }, [internalRequest.id, onThreadUpdate])

  async function sendMessage(body: string, attachmentIds?: string[]) {
    try {
      await fetchAdminBff(`/api/project-requests/${request.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, attachmentIds }),
      })
      await refreshThread()
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Send failed',
      }
    }
  }

  return (
    <section className="rounded-xl border border-sanmarino/25 bg-sanmarino/5 p-5 dark:border-sanmarino/30 dark:bg-sanmarino/10">
      <p className="text-xs uppercase tracking-[0.14em] text-sanmarino">Team only</p>
      <h3 className={`mt-1 text-lg text-chambray ${bricolage_grot600.className}`}>
        Team review
      </h3>
      <p className="mt-1 text-sm text-app-muted">
        Internal discussion — not visible to the client. Attach team files from the Files tab or
        your computer.
      </p>

      <div className="mt-4">
        <RequestMessageThread
          request={request}
          viewerRole="ADMIN"
          currentUserId={currentUserId}
          libraryVisibility="INTERNAL"
          uploadVisibility="INTERNAL"
          readOnly={readOnly}
          onSendMessage={async (body, attachmentIds) => {
            if (attachmentIds?.length) {
              return sendMessage(body, attachmentIds)
            }
            return sendMessage(body)
          }}
          onThreadUpdate={() => void refreshThread()}
        />
      </div>
    </section>
  )
}
