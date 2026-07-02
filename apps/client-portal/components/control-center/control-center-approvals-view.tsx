'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MarkApprovalsReadOnView from '@/components/control-center/mark-approvals-read-on-view'
import ApprovalAttachmentPreviews from '@/components/control-center/approval-attachment-previews'
import { LinkifiedBody } from '@/lib/projects/thread-content'
import ApprovalReviewPanel from '@/components/control-center/approval-review-panel'
import type { ClientApprovalRecordItem } from '@/lib/projects/api-types'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import {
  APPROVALS_TAB_QUERY,
  parseApprovalsTab,
  type ApprovalsTabId,
} from '@/lib/control-center/approvals-view'
import {
  useApproveApprovalItemMutation,
  useRequestApprovalNeedsChangesMutation,
} from '@/lib/api/mutations/approvals'
import {
  useApprovalHistoryQuery,
  useOpenApprovalsQuery,
} from '@/lib/api/queries/approvals'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/query-keys'
import { getPendingApprovalFilesFromOpenApprovals } from '@/lib/projects/fetch-projects-client'
import {
  findPendingApprovalFile,
} from '@/lib/projects/pending-approval-files'
import { bricolage_grot600 } from '@/styles/fonts'
import { ArrowLeft, FileText } from 'lucide-react'

const ATTACHMENT_ID_QUERY = 'attachmentId'
const APPROVAL_ITEM_ID_QUERY = 'approvalItemId'

export default function ControlCenterApprovalsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const deepLinkRequestId = searchParams.get('requestId')
  const deepLinkAttachmentId = searchParams.get(ATTACHMENT_ID_QUERY)
  const deepLinkApprovalItemId = searchParams.get(APPROVAL_ITEM_ID_QUERY)
  const hasActiveDeepLink = Boolean(deepLinkApprovalItemId || deepLinkRequestId)

  const initialTab = hasActiveDeepLink
    ? 'active'
    : parseApprovalsTab(searchParams.get(APPROVALS_TAB_QUERY))

  const [tab, setTab] = useState<ApprovalsTabId>(initialTab)
  const [selectedFileKey, setSelectedFileKey] = useState<string | null>(null)

  const {
    data: openApprovalsResult,
    isLoading: loading,
    isError: openIsError,
    error: openError,
    refetch: refetchOpen,
  } = useOpenApprovalsQuery()
  const {
    data: historyResult,
    isLoading: historyLoading,
    isError: historyIsError,
    error: historyError,
    refetch: refetchHistory,
  } = useApprovalHistoryQuery({ enabled: tab === 'history' })
  const pendingFiles = useMemo(
    () => getPendingApprovalFilesFromOpenApprovals(openApprovalsResult),
    [openApprovalsResult],
  )
  const history = historyResult?.items ?? []

  const selectedFile = useMemo(
    () => findPendingApprovalFile(pendingFiles, selectedFileKey),
    [pendingFiles, selectedFileKey],
  )
  const selectedId = selectedFile?.requestId ?? null

  const approveItem = useApproveApprovalItemMutation()
  const requestNeedsChanges = useRequestApprovalNeedsChangesMutation()

  const historyByProject = useMemo(() => {
    const groups = new Map<string, ClientApprovalRecordItem[]>()
    for (const record of history) {
      const key = record.projectTitle ?? record.projectId
      const list = groups.get(key) ?? []
      list.push(record)
      groups.set(key, list)
    }
    return [...groups.entries()]
  }, [history])

  const syncSelectionToUrl = (fileKey: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(CONTROL_CENTER_VIEW_QUERY, 'approvals')
    if (!fileKey) {
      params.delete('requestId')
      params.delete(ATTACHMENT_ID_QUERY)
      params.delete(APPROVAL_ITEM_ID_QUERY)
    } else {
      const file = pendingFiles.find((entry) => entry.key === fileKey)
      if (file) {
        params.set(APPROVAL_ITEM_ID_QUERY, file.approvalItemId)
        params.set('requestId', file.requestId)
        if (file.attachment?.id) {
          params.set(ATTACHMENT_ID_QUERY, file.attachment.id)
        } else {
          params.delete(ATTACHMENT_ID_QUERY)
        }
      }
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const selectFile = (fileKey: string) => {
    setSelectedFileKey(fileKey)
    syncSelectionToUrl(fileKey)
  }

  const setTabWithUrl = (nextTab: ApprovalsTabId) => {
    setTab(nextTab)
    const params = new URLSearchParams(searchParams.toString())
    params.set(CONTROL_CENTER_VIEW_QUERY, 'approvals')
    if (nextTab === 'history') {
      params.set(APPROVALS_TAB_QUERY, 'history')
      params.delete('requestId')
      params.delete(ATTACHMENT_ID_QUERY)
      params.delete(APPROVAL_ITEM_ID_QUERY)
      setSelectedFileKey(null)
    } else {
      params.delete(APPROVALS_TAB_QUERY)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  useEffect(() => {
    if (hasActiveDeepLink) {
      if (tab !== 'active') setTab('active')
      return
    }
    const urlTab = parseApprovalsTab(searchParams.get(APPROVALS_TAB_QUERY))
    if (urlTab !== tab) setTab(urlTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync tab from URL on back/forward
  }, [searchParams, hasActiveDeepLink])

  useEffect(() => {
    if (tab !== 'active' || loading || pendingFiles.length === 0) return

    if (deepLinkApprovalItemId) {
      const match = pendingFiles.find(
        (file) => file.approvalItemId === deepLinkApprovalItemId,
      )
      if (match) {
        setSelectedFileKey(match.key)
        return
      }
    }

    if (deepLinkRequestId) {
      const match = pendingFiles.find((file) => {
        if (file.requestId !== deepLinkRequestId) return false
        if (deepLinkAttachmentId) return file.attachment?.id === deepLinkAttachmentId
        return true
      })
      if (match) {
        setSelectedFileKey(match.key)
        return
      }
    }

    if (selectedFileKey && pendingFiles.some((file) => file.key === selectedFileKey)) {
      return
    }

    if (window.matchMedia('(min-width: 1024px)').matches) {
      const first = pendingFiles[0]!
      setSelectedFileKey(first.key)
      syncSelectionToUrl(first.key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link + auto-select on load only
  }, [tab, loading, pendingFiles, deepLinkRequestId, deepLinkAttachmentId, deepLinkApprovalItemId])

  useEffect(() => {
    if (deepLinkRequestId && tab === 'active') return
    if (window.matchMedia('(max-width: 1023px)').matches && !deepLinkRequestId) {
      setSelectedFileKey(null)
    }
  }, [deepLinkRequestId, tab])

  const clearSelection = () => {
    setSelectedFileKey(null)
    syncSelectionToUrl(null)
  }

  const invalidateApprovals = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.open() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.history() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    if (selectedId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(selectedId) })
    }
  }

  const showEmptyActive =
    !loading && !openIsError && pendingFiles.length === 0
  const showOpenLoadError = openIsError && pendingFiles.length === 0 && !loading
  const showOpenStaleBanner = openIsError && pendingFiles.length > 0
  const showHistoryLoadError = historyIsError && history.length === 0 && !historyLoading
  const showHistoryStaleBanner = historyIsError && history.length > 0
  const detailReady = Boolean(selectedFile && selectedFileKey)

  if (loading && pendingFiles.length === 0 && !selectedFileKey) {
    return <p className="text-sm text-app-muted">Loading approvals…</p>
  }

  const loadErrorSection = (message: string, onRetry: () => void) => (
    <section className="portal-glass-card space-y-4 p-8 text-center">
      <p className={`text-chambray ${bricolage_grot600.className}`}>
        Couldn&apos;t load approvals
      </p>
      <p className="text-sm text-app-muted">{message}</p>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="rounded-lg bg-sanmarino/15 px-4 py-2 text-sm font-medium text-chambray transition hover:bg-sanmarino/25"
      >
        Retry
      </button>
    </section>
  )

  const staleBanner = (message: string, onRetry: () => void) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-chambray/10 bg-chambray/5 px-4 py-3 text-sm text-app-muted">
      <span>{message}</span>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="font-medium text-sanmarino hover:text-chambray"
      >
        Retry
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-chambray/10 pb-2">
        <button
          type="button"
          onClick={() => setTabWithUrl('active')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'active'
              ? 'bg-sanmarino/15 text-chambray'
              : 'text-app-muted hover:bg-chambray/5'
          }`}
        >
          <span className="sm:hidden">
            Active{pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}
          </span>
          <span className="hidden sm:inline">
            Awaiting your approval
            {pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTabWithUrl('history')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'history'
              ? 'bg-sanmarino/15 text-chambray'
              : 'text-app-muted hover:bg-chambray/5'
          }`}
        >
          History
          {history.length > 0 ? ` (${history.length})` : ''}
        </button>
      </div>

      {tab === 'history' ? (
        historyLoading && history.length === 0 ? (
          <p className="text-sm text-app-muted">Loading history…</p>
        ) : showHistoryLoadError ? (
          loadErrorSection(
            historyError instanceof Error
              ? historyError.message
              : 'The approval history could not be loaded. Try again.',
            refetchHistory,
          )
        ) : history.length === 0 ? (
          <section className="portal-glass-card p-8 text-center">
            <p className="text-sm text-app-muted">No approvals recorded yet.</p>
            <p className="mt-2 text-xs text-app-muted">
              When you approve a project checkpoint, it appears here grouped by project.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {showHistoryStaleBanner
              ? staleBanner(
                  'Couldn\u2019t refresh history \u2014 showing last loaded data.',
                  refetchHistory,
                )
              : null}
            {historyByProject.map(([projectTitle, records]) => (
              <section key={projectTitle} className="portal-glass-card overflow-hidden">
                <p
                  className={`border-b border-chambray/6 px-4 py-3 text-sm text-chambray ${bricolage_grot600.className}`}
                >
                  {projectTitle}
                </p>
                <ul className="divide-y divide-chambray/6">
                  {records.map((record: ClientApprovalRecordItem) => (
                    <li key={record.id} className="px-4 py-4">
                      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                        {record.title}
                      </p>
                      <p className="mt-1 text-xs text-app-muted">
                        {new Date(record.approvedAt).toLocaleString()}
                        {record.targetPhase
                          ? ` · ${record.targetPhase.replace(/_/g, ' ').toLowerCase()}`
                          : ''}
                        {' · '}
                        {record.attachments?.length ? 'File review' : 'Text review'}
                      </p>
                      {record.attachments?.length ? (
                        <ApprovalAttachmentPreviews
                          attachments={record.attachments}
                          compact
                        />
                      ) : record.summary ? (
                        <div className="mt-2 text-sm text-app-muted">
                          <LinkifiedBody body={record.summary} />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="mt-3 text-xs text-sanmarino underline underline-offset-2"
                        onClick={() => {
                          const params = new URLSearchParams(window.location.search)
                          params.set(CONTROL_CENTER_VIEW_QUERY, 'projects')
                          params.set('projectId', record.projectId)
                          params.delete('requestId')
                          params.delete(ATTACHMENT_ID_QUERY)
                          const query = params.toString()
                          router.push(query ? `${pathname}?${query}` : pathname)
                        }}
                      >
                        View project
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : showOpenLoadError ? (
        loadErrorSection(
          openError instanceof Error
            ? openError.message
            : 'The approvals list could not be loaded. Try again.',
          refetchOpen,
        )
      ) : showEmptyActive ? (
        <section className="portal-glass-card p-8 text-center">
          <p className="text-sm text-app-muted">Nothing waiting on your approval right now.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {showOpenStaleBanner
            ? staleBanner(
                'Couldn\u2019t refresh approvals \u2014 showing last loaded data.',
                refetchOpen,
              )
            : null}
          <div className="lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-6">
            <ul
              className={`portal-glass-card divide-y divide-chambray/6 overflow-hidden ${
                selectedFileKey ? 'hidden lg:block' : ''
              }`}
            >
              {pendingFiles.map((file) => {
                const active = selectedFileKey === file.key
                return (
                  <li key={file.key}>
                    <button
                      type="button"
                      onClick={() => selectFile(file.key)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                        active ? 'bg-sanmarino/10' : 'hover:bg-chambray/5'
                      }`}
                    >
                      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                        {file.attachment?.fileName ?? file.checkpointTitle}
                      </p>
                      <p className="text-xs text-sanmarino">
                        {file.checkpointTitle}
                        {file.projectTitle ? ` · ${file.projectTitle}` : ''}
                      </p>
                    </button>
                    {file.attachment ? (
                      <div className={`px-4 pb-3 ${active ? 'bg-sanmarino/10' : ''}`}>
                        <ApprovalAttachmentPreviews
                          attachments={[file.attachment]}
                          compact
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-2 px-4 pb-3 text-xs text-app-muted ${
                          active ? 'bg-sanmarino/10' : ''
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Text review
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {selectedFileKey ? (
              detailReady && selectedFile ? (
                <section className="portal-glass-card p-6">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className={`mb-4 inline-flex min-h-10 items-center gap-2 text-sm text-sanmarino hover:text-chambray lg:hidden ${bricolage_grot600.className}`}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back to files
                  </button>
                  <MarkApprovalsReadOnView requestId={selectedFile.requestId} enabled />
                  <ApprovalReviewPanel
                    file={selectedFile}
                    onApprove={async (approvalItemId) => {
                      const result = await approveItem.mutateAsync(approvalItemId)
                      if (result.ok) {
                        invalidateApprovals()
                        clearSelection()
                      }
                      return {
                        ok: result.ok,
                        message: result.ok ? undefined : result.message,
                      }
                    }}
                    onNeedsChanges={async (approvalItemId, body) => {
                      const result = await requestNeedsChanges.mutateAsync({
                        approvalItemId,
                        body,
                      })
                      if (result.ok) {
                        invalidateApprovals()
                      }
                      return {
                        ok: result.ok,
                        message: result.ok ? undefined : result.message,
                      }
                    }}
                  />
                </section>
              ) : (
                <section className="portal-glass-card space-y-4 p-8 text-center">
                  <p className={`text-chambray ${bricolage_grot600.className}`}>
                    Opening review…
                  </p>
                </section>
              )
            ) : (
              <p className="hidden text-sm text-app-muted lg:block">
                Select a file to review and approve.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
