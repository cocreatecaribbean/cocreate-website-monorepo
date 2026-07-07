'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Download,
  FileText,
  FolderKanban,
  LayoutGrid,
  Sparkles,
  Users,
} from 'lucide-react'
import FilePreviewModal from '@/components/file-preview-modal'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import ThreadSummaryExport from '@cocreate/app-ui/thread-summary-export'
import ProjectCoverEditor from '@/components/project-cover-editor'
import ProjectStatusAttribution, { ProjectTimeline } from '@/components/project-status-attribution'
import ProjectTeamAside from '@/components/project-team-aside'
import type { PortalProjectTabId } from '@/lib/control-center/project-workspace'
import type { ClientProjectDetail, ProjectRequestItem } from '@/lib/projects/api-types'
import { queryKeys } from '@/lib/api/query-keys'
import {
  useApproveApprovalItemMutation,
  useRequestApprovalNeedsChangesMutation,
} from '@/lib/api/mutations/approvals'
import { useOpenApprovalsQuery } from '@/lib/api/queries/approvals'
import { getPendingApprovalFilesFromOpenApprovals } from '@/lib/projects/fetch-projects-client'
import { appendRequestMessageToCache } from '@/lib/projects/append-request-message-cache'
import { useRequestThreadQuery, prefetchRequestThread } from '@/lib/api/queries/projects'
import {
  createCancellationRequest,
  fetchAttachmentDownloadUrl,
  sendRequestMessage,
} from '@/lib/projects/fetch-projects-client'
import { useProjectMembers } from '@/lib/team/use-project-members'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  downloadProjectThreadSummaryPdf,
  fetchProjectAttachmentPreviewUrl,
  generateProjectThreadSummary,
} from '@/lib/messaging/fetch-thread-summary'
import WorkspaceSectionNav from '@cocreate/app-ui/workspace-section-nav'

function findThread(
  project: ClientProjectDetail,
  type: 'ONBOARDING' | 'PROGRESS' | 'CANCELLATION',
) {
  return project.requests?.find((r) => r.type === type) ?? null
}

function formatPhaseLabel(phase: string | null | undefined): string {
  if (!phase) return '—'
  return phase.replace(/_/g, ' ')
}

const TABS: Array<{ id: PortalProjectTabId; label: string; description: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', description: 'Project snapshot, status, and key details', icon: LayoutGrid },
  { id: 'onboarding', label: 'Onboarding', description: 'Initial setup, requirements, and kickoff with your team', icon: Sparkles },
  { id: 'progress', label: 'Progress', description: 'Day-to-day messages, deliverables, and checkpoints', icon: Bell },
  { id: 'files', label: 'Files', description: 'Shared deliverables and project assets', icon: FileText },
  { id: 'team', label: 'Team', description: 'People on this project and their roles', icon: Users },
]

type LazyThreadProps = {
  request: ProjectRequestItem
  loadMessages: boolean
  viewerRole: 'CLIENT'
  readOnly?: boolean
  invalidateQueryKeys: import('@tanstack/react-query').QueryKey[]
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string }>
  pendingApprovalFiles?: import('@/lib/projects/pending-approval-files').PendingApprovalFile[]
  onApproveFile?: (
    approvalItemId: string,
  ) => Promise<{ ok: boolean; message?: string }>
  onNeedsChangesFile?: (
    approvalItemId: string,
    body?: string,
  ) => Promise<{ ok: boolean; message?: string }>
}

function ThreadLoadingSkeleton() {
  return (
    <div className="space-y-3 py-2" aria-busy="true" aria-label="Loading messages">
      <div className="h-16 animate-pulse rounded-lg bg-chambray/8" />
      <div className="ml-8 h-12 animate-pulse rounded-lg bg-chambray/6" />
      <div className="h-14 animate-pulse rounded-lg bg-chambray/8" />
    </div>
  )
}

function LazyRequestMessageThread({
  request,
  loadMessages,
  ...props
}: LazyThreadProps) {
  const { data, isLoading } = useRequestThreadQuery(loadMessages ? request.id : null)
  if (loadMessages && isLoading && !data) {
    return <ThreadLoadingSkeleton />
  }
  const resolved = data ?? request
  return <RequestMessageThread request={resolved} {...props} />
}

type PortalProjectWorkspaceProps = {
  project: ClientProjectDetail
  initialTab?: PortalProjectTabId
  onBack: () => void
  onRefresh: () => Promise<void>
  onTabChange?: (tab: PortalProjectTabId) => void
}

export default function PortalProjectWorkspace({
  project,
  initialTab = 'overview',
  onBack,
  onRefresh,
  onTabChange,
}: PortalProjectWorkspaceProps) {
  const queryClient = useQueryClient()
  const { data: openApprovalsResult, refetch: refetchOpenApprovals } = useOpenApprovalsQuery()
  const approveItem = useApproveApprovalItemMutation()
  const requestNeedsChanges = useRequestApprovalNeedsChangesMutation()
  const projectPendingApprovals = useMemo(() => {
    return getPendingApprovalFilesFromOpenApprovals(openApprovalsResult).filter(
      (file) => file.projectId === project.id,
    )
  }, [openApprovalsResult, project.id])
  const [tab, setTab] = useState<PortalProjectTabId>(initialTab)
  const [message, setMessage] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [previewFile, setPreviewFile] = useState<{
    fileName: string
    mimeType: string
    url: string | null
  } | null>(null)
  const [attachmentUrlCache, setAttachmentUrlCache] = useState<Record<string, string>>({})
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    project.coverImageUrl ?? null,
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const { canManage, loading: membersLoading } = useProjectMembers(project.id)

  useEffect(() => {
    if (tab === 'progress') {
      void refetchOpenApprovals()
    }
  }, [refetchOpenApprovals, tab])

  const isOnboarded = project.status !== 'SUBMITTED'
  const visibleTabs = useMemo(
    () => TABS.filter((item) => item.id !== 'progress' || isOnboarded),
    [isOnboarded],
  )

  useEffect(() => {
    const next =
      initialTab === 'progress' && !isOnboarded ? 'overview' : initialTab
    setTab(next)
  }, [initialTab, project.id, isOnboarded])

  useEffect(() => {
    if (!isOnboarded && tab === 'progress') {
      setTab('overview')
    }
  }, [isOnboarded, tab])

  useEffect(() => {
    setCoverImageUrl(project.coverImageUrl ?? null)
  }, [project.coverImageUrl, project.id])

  useEffect(() => {
    const progressThread = findThread(project, 'PROGRESS')
    const onboardingThread = findThread(project, 'ONBOARDING')
    if (progressThread) void prefetchRequestThread(queryClient, progressThread.id)
    if (onboardingThread) void prefetchRequestThread(queryClient, onboardingThread.id)
  }, [project.id, queryClient])

  const prefetchThreadForTab = useCallback(
    (tabId: PortalProjectTabId) => {
      if (tabId === 'progress') {
        const progressThread = findThread(project, 'PROGRESS')
        if (progressThread) void prefetchRequestThread(queryClient, progressThread.id)
        return
      }
      if (tabId === 'onboarding') {
        const onboardingThread = findThread(project, 'ONBOARDING')
        if (onboardingThread) void prefetchRequestThread(queryClient, onboardingThread.id)
      }
    },
    [project, queryClient],
  )

  const setTabAndNotify = useCallback(
    (next: PortalProjectTabId) => {
      setTab(next)
      onTabChange?.(next)
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [onTabChange],
  )

  const onboarding = findThread(project, 'ONBOARDING')
  const progress = findThread(project, 'PROGRESS')
  const cancellation = findThread(project, 'CANCELLATION')
  const onboardingClosed = onboarding
    ? ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(onboarding.status)
    : false
  const canCancel = project.status === 'ACTIVE' || project.status === 'ON_HOLD'

  const requestCancellation = async () => {
    if (!window.confirm('Request to cancel this project? CoCreate will review and respond.')) {
      return
    }
    setCancelling(true)
    const result = await createCancellationRequest(project.id, cancelReason.trim() || undefined)
    setCancelling(false)
    if (!result.ok) {
      setMessage(result.message ?? 'Could not submit cancellation request')
      return
    }
    setCancelReason('')
    setMessage('Cancellation request sent.')
    await onRefresh()
  }

  const invalidateThread = useCallback(
    async (requestId: string) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId) })
      await onRefresh()
    },
    [queryClient, onRefresh],
  )

  const threadProps = (req: NonNullable<typeof onboarding>) => ({
    request: req,
    viewerRole: 'CLIENT' as const,
    invalidateQueryKeys: [
      queryKeys.requests.detail(req.id),
      queryKeys.projects.detail(project.id),
    ],
    onSendMessage: async (body: string, attachmentIds?: string[]) => {
      const result = await sendRequestMessage(req.id, body, attachmentIds)
      if (result.ok) {
        appendRequestMessageToCache(queryClient, req.id, result.data)
        void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) })
      }
      return { ok: result.ok, message: result.ok ? undefined : result.message }
    },
  })

  const progressThreadProps = progress
    ? {
        ...threadProps(progress),
        pendingApprovalFiles: projectPendingApprovals,
        onApproveFile: async (approvalItemId: string) => {
          const result = await approveItem.mutateAsync(approvalItemId)
          if (result.ok) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(progress.id) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) })
          }
          return { ok: result.ok, message: result.ok ? undefined : result.message }
        },
        onNeedsChangesFile: async (approvalItemId: string, body?: string) => {
          const result = await requestNeedsChanges.mutateAsync({ approvalItemId, body })
          return { ok: result.ok, message: result.ok ? undefined : result.message }
        },
      }
    : null

  const getAttachmentUrl = useCallback(
    async (attachmentId: string) => {
      const cached = attachmentUrlCache[attachmentId]
      if (cached) return cached
      const result = await fetchAttachmentDownloadUrl(attachmentId)
      if (result.url) {
        setAttachmentUrlCache((prev) => ({ ...prev, [attachmentId]: result.url! }))
      }
      return result.url
    },
    [attachmentUrlCache],
  )

  const attachments = project.attachments ?? []
  const showProgressThread = Boolean(progress && isOnboarded)

  return (
    <main className="flex min-h-0 flex-1 flex-col max-md:-m-4 sm:max-md:-m-6">
      <div className="border-b border-chambray/8 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray ${bricolage_grot600.className}`}
        >
          ← All projects
        </button>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="rounded-xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-2.5 text-sanmarino ring-1 ring-sanmarino/10">
            <FolderKanban className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
            >
              {project.title}
            </h1>
            {project.description ? (
              <p className="mt-1 line-clamp-3 text-sm text-app-muted">{project.description}</p>
            ) : null}
            <div className="mt-2">
              <ProjectStatusAttribution project={project} variant="detail" />
            </div>
          </div>
        </div>
        <WorkspaceSectionNav
          items={visibleTabs}
          activeId={tab}
          onSelect={setTabAndNotify}
          onItemHover={prefetchThreadForTab}
          ariaLabel="Project sections"
          inputClassName="portal-input"
          pillClassName={bricolage_grot600.className}
        />
      </div>

      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="space-y-4 sm:space-y-6">
          {tab === 'overview' ? (
            <>
              {canManage && !membersLoading ? (
                <ProjectCoverEditor
                  variant="compact"
                  projectId={project.id}
                  coverImageUrl={coverImageUrl}
                  title={project.title}
                  onUpdated={(url) => {
                    setCoverImageUrl(url)
                    void onRefresh()
                  }}
                />
              ) : null}

              {message ? (
                <p className="rounded-xl border border-sanmarino/20 bg-sanmarino/5 px-4 py-3 text-sm text-chambray">
                  {message}
                </p>
              ) : null}

              {project.phase ? (
                <p className="text-sm text-app-muted">
                  Phase:{' '}
                  <span className={`text-chambray ${bricolage_grot600.className}`}>
                    {formatPhaseLabel(project.phase)}
                  </span>
                </p>
              ) : null}

              {project.activities && project.activities.length > 0 ? (
                <ProjectTimeline
                  activities={project.activities}
                  title="Project timeline"
                />
              ) : (
                <section className="portal-glass-card p-5 sm:p-6">
                  <p className="text-sm text-app-muted">No activity recorded yet.</p>
                </section>
              )}

              {cancellation ? (
                <section className="portal-glass-card portal-thread-surface">
                  <div className="portal-thread-surface-header">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-chambray ${bricolage_grot600.className}`}>Cancellation</p>
                        {cancellation.cancellationOutcome ? (
                          <p className="mt-1 text-sm text-app-muted">
                            Outcome:{' '}
                            {cancellation.cancellationOutcome.replace(/_/g, ' ').toLowerCase()}
                            {cancellation.cancellationFeeAmount != null
                              ? ` · Fee: ${cancellation.cancellationFeeAmount}`
                              : ''}
                          </p>
                        ) : null}
                      </div>
                      <ThreadSummaryExport
                        fetchAttachmentDownloadUrl={fetchProjectAttachmentPreviewUrl}
                        onGenerate={(options) =>
                          generateProjectThreadSummary(cancellation.id, options)
                        }
                        onExportPdf={(options) =>
                          downloadProjectThreadSummaryPdf(cancellation.id, options)
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-0 min-h-0 flex-1 md:mt-4">
                    <LazyRequestMessageThread
                      {...threadProps(cancellation)}
                      loadMessages={tab === 'overview'}
                      readOnly={['RESOLVED', 'REJECTED'].includes(cancellation.status)}
                    />
                  </div>
                </section>
              ) : null}

              {canCancel && !cancellation ? (
                <section className="portal-glass-card border border-red-200/40 p-5 sm:p-6">
                  <p className={`text-chambray ${bricolage_grot600.className}`}>
                    Request cancellation
                  </p>
                  <p className="mt-1 text-sm text-app-muted">
                    Tell CoCreate you wish to end this project. We will confirm any fees before
                    it is cancelled.
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Optional reason for cancellation…"
                    rows={3}
                    className="portal-textarea mt-4 w-full resize-y"
                  />
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => void requestCancellation()}
                    className="portal-btn-ghost mt-3 text-sm text-red-800 ring-red-200/60"
                  >
                    {cancelling ? 'Sending…' : 'Request project cancellation'}
                  </button>
                </section>
              ) : null}
            </>
          ) : null}

          {tab === 'onboarding' ? (
            onboarding ? (
              <section className="portal-glass-card portal-thread-surface">
                <div className="portal-thread-surface-header">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-chambray ${bricolage_grot600.className}`}>
                        Onboarding conversation
                      </p>
                      <p className="mt-1 text-xs text-app-muted">
                        {onboardingClosed
                          ? 'Closed after project was onboarded — kept for your records.'
                          : 'Discussion before your project is accepted.'}
                      </p>
                    </div>
                    <ThreadSummaryExport
                      fetchAttachmentDownloadUrl={fetchProjectAttachmentPreviewUrl}
                      onGenerate={(options) =>
                        generateProjectThreadSummary(onboarding.id, options)
                      }
                      onExportPdf={(options) =>
                        downloadProjectThreadSummaryPdf(onboarding.id, options)
                      }
                    />
                  </div>
                </div>
                <div className="mt-0 min-h-0 flex-1 md:mt-4">
                  <LazyRequestMessageThread
                    {...threadProps(onboarding)}
                    loadMessages={tab === 'onboarding'}
                    readOnly={onboardingClosed}
                  />
                </div>
              </section>
            ) : (
              <p className="text-sm text-app-muted">No onboarding conversation yet.</p>
            )
          ) : null}

          {tab === 'progress' ? (
            showProgressThread && progress ? (
              <section className="portal-glass-card portal-thread-surface">
                <div className="portal-thread-surface-header">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-chambray ${bricolage_grot600.className}`}>Project progress</p>
                      <p className="mt-1 text-xs text-app-muted">
                        Updates, progress checks, and replies with CoCreate.
                      </p>
                    </div>
                    <ThreadSummaryExport
                      fetchAttachmentDownloadUrl={fetchProjectAttachmentPreviewUrl}
                      onGenerate={(options) =>
                        generateProjectThreadSummary(progress.id, options)
                      }
                      onExportPdf={(options) =>
                        downloadProjectThreadSummaryPdf(progress.id, options)
                      }
                    />
                  </div>
                </div>
                <div className="mt-0 min-h-0 flex-1 md:mt-4">
                  <LazyRequestMessageThread
                    {...(progressThreadProps ?? threadProps(progress))}
                    loadMessages={tab === 'progress'}
                  />
                </div>
              </section>
            ) : (
              <p className="text-sm text-app-muted">No progress conversation yet.</p>
            )
          ) : null}

          {tab === 'files' ? (
            <>
              {attachments.length > 0 ? (
                <section className="portal-glass-card p-5 sm:p-6">
                  <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>Files</p>
                  <ul className="mt-3 space-y-2 text-sm text-app-muted">
                    {attachments.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-chambray/5"
                      >
                        <button
                          type="button"
                          className="group flex min-w-0 items-center gap-2 text-left"
                          onClick={async () => {
                            const url = await getAttachmentUrl(f.id)
                            setPreviewFile({
                              fileName: f.fileName,
                              mimeType: f.mimeType,
                              url,
                            })
                          }}
                          aria-label={`Preview ${f.fileName}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sanmarino/10 text-sanmarino">
                            {f.mimeType.startsWith('image/') && attachmentUrlCache[f.id] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={attachmentUrlCache[f.id]}
                                alt={f.fileName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileText className="h-4 w-4" aria-hidden />
                            )}
                          </span>
                          <span className="truncate text-chambray underline-offset-4 group-hover:underline">
                            {f.fileName}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const url = await getAttachmentUrl(f.id)
                            if (!url) return
                            const anchor = document.createElement('a')
                            anchor.href = url
                            anchor.download = f.fileName
                            anchor.rel = 'noopener noreferrer'
                            anchor.click()
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sanmarino transition hover:bg-chambray/8 hover:text-chambray"
                          aria-label={`Download ${f.fileName}`}
                        >
                          <Download className="h-4 w-4" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="text-sm text-app-muted">No files attached to this project yet.</p>
              )}
              <FilePreviewModal
                open={Boolean(previewFile)}
                fileName={previewFile?.fileName ?? ''}
                mimeType={previewFile?.mimeType ?? ''}
                url={previewFile?.url ?? null}
                onClose={() => setPreviewFile(null)}
              />
            </>
          ) : null}

          {tab === 'team' ? <ProjectTeamAside projectId={project.id} /> : null}
        </div>
      </div>
    </main>
  )
}
