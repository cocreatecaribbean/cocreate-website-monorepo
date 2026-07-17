'use client'

import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import FilePreviewModal from '@/components/file-preview-modal'
import PortalFileRow from '@/components/control-center/portal-file-row'
import type { ClientFilesLibrary, ProjectAttachmentWithUsage } from '@/lib/projects/api-types'
import { useUploadProjectFilesMutation } from '@/lib/api/mutations/files'
import {
  useProjectFileReactions,
  useSyncFileReactionCache,
} from '@/lib/api/queries/file-reactions'
import { queryKeys } from '@/lib/api/query-keys'
import { fetchProjectFiles } from '@/lib/projects/fetch-projects-client'
import { removeLibraryAttachment } from '@/lib/projects/remove-library-attachment'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'
import { bricolage_grot600 } from '@/styles/fonts'
import { FolderKanban, Loader2, Upload } from 'lucide-react'

export type PortalProjectFilesPanelProps = {
  projectId: string
  projectTitle: string
  currentUserId?: string | null
  group?: ClientFilesLibrary['projects'][number]
  onRefresh?: () => void | Promise<void>
  onLibraryChange?: () => void
}

function emptyGroup(
  projectId: string,
  projectTitle: string,
): ClientFilesLibrary['projects'][number] {
  return {
    projectId,
    projectTitle,
    libraryUploads: [],
    usedInThreads: [],
  }
}

export default function PortalProjectFilesPanel({
  projectId,
  projectTitle,
  currentUserId = null,
  group: groupProp,
  onRefresh,
  onLibraryChange,
}: PortalProjectFilesPanelProps) {
  const { canReactToFiles, canSendMessages } = usePortalPermissions()
  const canUpload = canSendMessages
  const showReaction = canReactToFiles
  const { reactionsById } = useProjectFileReactions(projectId)
  const syncReactionCache = useSyncFileReactionCache(projectId)
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadProjectFilesMutation(projectId)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    file: ProjectAttachmentWithUsage
    url: string | null
  } | null>(null)

  const filesQuery = useQuery({
    queryKey: queryKeys.files.project(projectId),
    queryFn: async () => {
      const library = await fetchProjectFiles(projectId)
      return library?.projects[0] ?? emptyGroup(projectId, projectTitle)
    },
    enabled: !groupProp && Boolean(projectId),
  })

  const group = groupProp ?? filesQuery.data ?? emptyGroup(projectId, projectTitle)
  const loading = !groupProp && filesQuery.isLoading
  const loadError = !groupProp && filesQuery.isError

  const refreshFiles = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    } else {
      await filesQuery.refetch()
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.files.all })
    onLibraryChange?.()
  }, [filesQuery, onLibraryChange, onRefresh, queryClient])

  const handleDeleteFile = useCallback(
    async (file: ProjectAttachmentWithUsage) => {
      setDeletingAttachmentId(file.id)
      setDeleteError(null)
      const result = await removeLibraryAttachment(queryClient, {
        attachmentId: file.id,
        projectId,
      })
      if (!result.ok) {
        setDeleteError(result.message)
      } else {
        await refreshFiles()
      }
      setDeletingAttachmentId(null)
    },
    [projectId, queryClient, refreshFiles],
  )

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploadError(null)
    const result = await uploadMutation.mutateAsync({
      files: Array.from(files),
    })
    if (!result.ok) {
      setUploadError(result.message ?? 'Upload failed')
    } else {
      await refreshFiles()
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const totalCount = group.libraryUploads.length + group.usedInThreads.length
  const uploading = uploadMutation.isPending
  const canDeleteFile = (file: ProjectAttachmentWithUsage) =>
    Boolean(canUpload && currentUserId && file.uploadedByUserId === currentUserId)

  if (loading) {
    return (
      <div className="portal-glass-card flex items-center justify-center gap-2 p-12 text-sm text-app-muted">
        <Loader2 className="h-5 w-5 animate-spin text-sanmarino" aria-hidden />
        Loading files…
      </div>
    )
  }

  if (loadError) {
    return (
      <p className="portal-glass-card portal-alert-error p-5 sm:p-6">Could not load files</p>
    )
  }

  return (
    <>
      <section className="portal-glass-card portal-animate-in overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chambray/8 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-sanmarino" aria-hidden />
            <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>
              {group.projectTitle}
            </h3>
            <span className="text-xs text-app-muted">
              {totalCount} file{totalCount === 1 ? '' : 's'}
            </span>
          </div>
          <div>
            {canUpload ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => void onUpload(e.target.files)}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="portal-btn-ghost inline-flex items-center gap-2 text-sm"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden />
                  )}
                  Add files
                </button>
              </>
            ) : null}
          </div>
        </div>

        {uploadError ? (
          <p className="portal-alert-error mx-5 my-3">{uploadError}</p>
        ) : null}
        {deleteError ? (
          <p className="portal-alert-error mx-5 my-3">{deleteError}</p>
        ) : null}

        {totalCount === 0 ? (
          <p className="px-5 py-8 text-sm text-app-muted">No files for this project yet.</p>
        ) : (
          <div className="divide-y divide-chambray/6">
            <div>
              <p className="px-5 py-3 text-xs font-medium tracking-wide text-app-muted uppercase">
                Library uploads
              </p>
              {group.libraryUploads.length === 0 ? (
                <p className="px-5 pb-4 text-sm text-app-muted">No library-only files.</p>
              ) : (
                <ul>
                  {group.libraryUploads.map((file) => (
                    <PortalFileRow
                      key={file.id}
                      file={file}
                      onPreview={(item, url) => setPreview({ file: item, url })}
                      onDelete={handleDeleteFile}
                      deleting={deletingAttachmentId === file.id}
                      canDelete={canDeleteFile(file)}
                      showReaction={showReaction}
                      initialReaction={reactionsById.get(file.id)?.myReaction ?? null}
                      onReactionChange={syncReactionCache}
                    />
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="px-5 py-3 text-xs font-medium tracking-wide text-app-muted uppercase">
                Used in message threads
              </p>
              {group.usedInThreads.length === 0 ? (
                <p className="px-5 pb-4 text-sm text-app-muted">No files shared in threads yet.</p>
              ) : (
                <ul>
                  {group.usedInThreads.map((file) => (
                    <PortalFileRow
                      key={file.id}
                      file={file}
                      onPreview={(item, url) => setPreview({ file: item, url })}
                      onDelete={handleDeleteFile}
                      deleting={deletingAttachmentId === file.id}
                      canDelete={canDeleteFile(file)}
                      showReaction={showReaction}
                      initialReaction={reactionsById.get(file.id)?.myReaction ?? null}
                      onReactionChange={syncReactionCache}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <FilePreviewModal
        open={Boolean(preview)}
        fileName={preview?.file.fileName ?? ''}
        mimeType={preview?.file.mimeType ?? ''}
        url={preview?.url ?? null}
        onClose={() => setPreview(null)}
      />
    </>
  )
}
