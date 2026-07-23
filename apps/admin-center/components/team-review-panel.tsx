'use client'

import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminSession } from '@/components/admin-session-provider'
import RequestMessageThread from '@/components/request-message-thread'
import ResizableAdminThreadSurface from '@/components/resizable-admin-thread-surface'
import { useSendAdminRequestMessageMutation } from '@/lib/api/mutations/projects'
import { adminQueryKeys } from '@/lib/api/query-keys'
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
  const queryClient = useQueryClient()
  const { session } = useAdminSession()
  const currentUserId = session?.mode === 'user' ? session.userId : null

  const sendMessageMutation = useSendAdminRequestMessageMutation(internalRequest.id)

  const invalidateKeys = useMemo(
    () => [
      adminQueryKeys.requests.detail(internalRequest.id),
      adminQueryKeys.projects.detail(_projectId),
      adminQueryKeys.projects.all,
    ],
    [internalRequest.id, _projectId],
  )

  const refreshThread = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.requests.detail(internalRequest.id),
    })
    onThreadUpdate?.()
  }

  async function sendMessage(
    body: string,
    attachmentIds?: string[],
    options?: { requestApproval?: boolean },
  ) {
    try {
      const message = await sendMessageMutation.mutateAsync({
        body,
        attachmentIds,
        requestApproval: options?.requestApproval,
      })
      return { ok: true as const, data: message }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Send failed',
      }
    }
  }

  return (
    <ResizableAdminThreadSurface
      storageKey={`admin-thread-surface:team-review:${internalRequest.id}`}
      className="rounded-xl border border-sanmarino/25 bg-sanmarino/5 p-5 dark:border-sanmarino/30 dark:bg-sanmarino/10"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <p className="text-xs uppercase tracking-[0.14em] text-sanmarino">Team only</p>
          <h3 className={`mt-1 text-lg text-chambray ${bricolage_grot600.className}`}>
            Team review
          </h3>
          <p className="mt-1 text-sm text-app-muted">
            Internal discussion — not visible to the client. Attach team files from the Files tab or
            your computer.
          </p>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <RequestMessageThread
            request={internalRequest}
            viewerRole="ADMIN"
            currentUserId={currentUserId}
            libraryVisibility="INTERNAL"
            uploadVisibility="INTERNAL"
            readOnly={readOnly}
            invalidateQueryKeys={invalidateKeys}
            onSendMessage={async (body, attachmentIds) => {
              if (attachmentIds?.length) {
                return sendMessage(body, attachmentIds)
              }
              return sendMessage(body)
            }}
            onThreadUpdate={() => void refreshThread()}
          />
        </div>
      </div>
    </ResizableAdminThreadSurface>
  )
}
