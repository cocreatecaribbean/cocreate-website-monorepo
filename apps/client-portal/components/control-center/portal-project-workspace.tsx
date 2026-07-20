'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Star,
  Bell,
  FileText,
  FolderKanban,
  LayoutGrid,
  Sparkles,
  Users,
} from 'lucide-react'
import PortalProjectFilesPanel from '@/components/control-center/portal-project-files-panel'
import PortalProjectTopPicksPanel from '@/components/control-center/portal-project-top-picks-panel'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import { useClientThreadLive } from '@/lib/messaging/use-client-thread-live'
import ThreadSummaryExport from '@cocreate/app-ui/thread-summary-export'
import ProjectCoverEditor from '@/components/project-cover-editor'
import ProjectStatusAttribution, { ProjectTimeline } from '@/components/project-status-attribution'
import ProjectTeamAside from '@/components/project-team-aside'
import ProjectTitleRename from '@/components/project-title-rename'
import type { PortalProjectTabId } from '@/lib/control-center/project-workspace'
import type { ClientProjectDetail, ProjectRequestItem } from '@/lib/projects/api-types'
import { queryKeys } from '@/lib/api/query-keys'
import { useRenameProjectMutation } from '@/lib/api/mutations/projects'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { prefetchRequestThread } from '@/lib/api/queries/projects'
import {
  createCancellationRequest,
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
  { id: 'progress', label: 'Progress', description: 'Day-to-day messages, deliverables, and updates', icon: Bell },
  { id: 'files', label: 'Files', description: 'Shared deliverables and project assets', icon: FileText },
  { id: 'top-picks', label: 'Top Picks', description: 'Files your team loved on this project', icon: Star },
  { id: 'team', label: 'Team', description: 'People on this project and their roles', icon: Users },
]

type LazyThreadProps = {
  request: ProjectRequestItem
  loadMessages: boolean
  parentOwnsMessages?: boolean
  liveMessages?: import('@/lib/projects/api-types').ProjectRequestMessage[]
  liveMessagesLoading?: boolean
  viewerRole: 'CLIENT'
  readOnly?: boolean
  invalidateQueryKeys: import('@tanstack/react-query').QueryKey[]
  onSendMessage: (
    body: string,
    attachmentIds?: string[],
  ) => Promise<{ ok: boolean; message?: string; data?: import('@/lib/projects/api-types').ProjectRequestMessage }>
}

function LazyRequestMessageThread({
  request,
  loadMessages,
  parentOwnsMessages,
  liveMessages,
  liveMessagesLoading,
  ...props
}: LazyThreadProps) {
  return (
    <RequestMessageThread
      request={request}
      loadMessages={loadMessages}
      parentOwnsMessages={parentOwnsMessages}
      liveMessages={liveMessages}
      liveMessagesLoading={liveMessagesLoading}
      {...props}
    />
  )
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
  const { data: profile } = usePortalProfileQuery()
  const currentUserId = profile?.user.id ?? null
  const isViewer = Boolean(profile?.permissions.isViewer)
  const canSendMessages = profile?.permissions.canSendMessages !== false && !isViewer
  const canRenameProject = Boolean(profile?.permissions.canCreateProject)
  const renameProjectMutation = useRenameProjectMutation(project.id)
  const [tab, setTab] = useState<PortalProjectTabId>(initialTab)
  const [message, setMessage] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    project.coverImageUrl ?? null,
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const { canManage, loading: membersLoading } = useProjectMembers(project.id)

  const isOnboarded = project.status !== 'SUBMITTED'
  const visibleTabs = useMemo(() => {
    if (isViewer) {
      return TABS.filter((item) => item.id === 'progress' || item.id === 'top-picks').filter(
        (item) => item.id !== 'progress' || isOnboarded,
      )
    }
    return TABS.filter((item) => item.id !== 'progress' || isOnboarded)
  }, [isOnboarded, isViewer])

  useEffect(() => {
    let next =
      initialTab === 'progress' && !isOnboarded ? 'overview' : initialTab
    if (isViewer) {
      if (next !== 'progress' && next !== 'top-picks') {
        next = isOnboarded ? 'progress' : 'top-picks'
      }
      if (next === 'progress' && !isOnboarded) next = 'top-picks'
    }
    setTab(next)
  }, [initialTab, project.id, isOnboarded, isViewer])

  useEffect(() => {
    if (!isOnboarded && tab === 'progress') {
      setTab(isViewer ? 'top-picks' : 'overview')
    }
  }, [isOnboarded, tab, isViewer])

  useEffect(() => {
    if (!isViewer) return
    if (tab !== 'progress' && tab !== 'top-picks') {
      setTab(isOnboarded ? 'progress' : 'top-picks')
    }
  }, [isViewer, tab, isOnboarded])

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
  const canCancel =
    !isViewer && (project.status === 'ACTIVE' || project.status === 'ON_HOLD')

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

  const threadProps = (req: NonNullable<typeof onboarding>) => ({
    request: req,
    viewerRole: 'CLIENT' as const,
    invalidateQueryKeys: [
      queryKeys.requests.messages(req.id),
      queryKeys.projects.detail(project.id),
    ],
    onSendMessage: async (body: string, attachmentIds?: string[]) => {
      const result = await sendRequestMessage(req.id, body, attachmentIds)
      if (result.ok) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) })
        return { ok: true as const, data: result.data }
      }
      return { ok: false as const, message: result.message }
    },
  })

  const progressThreadProps = progress ? threadProps(progress) : null

  const showProgressThread = Boolean(progress && isOnboarded)

  const progressInvalidateQueryKeys = useMemo(
    () => (progress ? [queryKeys.projects.detail(project.id)] : []),
    [progress, project.id],
  )

  const progressLive = useClientThreadLive(
    showProgressThread && progress ? progress.id : undefined,
    {
      invalidateQueryKeys: progressInvalidateQueryKeys,
      onAttachmentUpdate: () => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.fileReactions.project(project.id),
        })
        void queryClient.invalidateQueries({ queryKey: queryKeys.topPicks.all })
      },
    },
  )

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
            {canRenameProject ? (
              <ProjectTitleRename
                title={project.title}
                headingClassName={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
                inputClassName="portal-input"
                onSave={async (title) => {
                  await renameProjectMutation.mutateAsync(title)
                  setMessage('Project renamed.')
                  await onRefresh()
                }}
              />
            ) : (
              <h1
                className={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
              >
                {project.title}
              </h1>
            )}
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
                        Updates, deliverables, and replies with CoCreate.
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
                    parentOwnsMessages
                    liveMessages={progressLive.messages}
                    liveMessagesLoading={progressLive.isLoading}
                    loadMessages={false}
                    readOnly={!canSendMessages}
                  />
                </div>
              </section>
            ) : (
              <p className="text-sm text-app-muted">No progress conversation yet.</p>
            )
          ) : null}

          {tab === 'files' && !isViewer ? (
            <PortalProjectFilesPanel
              projectId={project.id}
              projectTitle={project.title}
              currentUserId={currentUserId}
              onLibraryChange={() => {
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.projects.detail(project.id),
                })
              }}
            />
          ) : null}

          {tab === 'top-picks' ? (
            <PortalProjectTopPicksPanel projectId={project.id} />
          ) : null}

          {tab === 'team' && !isViewer ? <ProjectTeamAside projectId={project.id} /> : null}
        </div>
      </div>
    </main>
  )
}
