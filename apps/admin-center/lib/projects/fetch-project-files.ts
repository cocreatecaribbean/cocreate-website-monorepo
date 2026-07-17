import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type {
  ClientFilesLibrary,
  FilesQuery,
  ProjectAttachment,
} from '@/lib/projects/types'

type UploadUrlResponse = {
  storagePath: string
  signedUrl: string
  token: string
  expiresIn: number
}

export type StagedProjectFile = {
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

type AttachmentDownloadResponse = {
  id: string
  fileName: string
  mimeType: string
  download: { signedUrl: string }
}

/** Upload bytes to storage only; caller registers the attachment afterward. */
async function stageSingleProjectFile(
  projectId: string,
  file: File,
): Promise<StagedProjectFile> {
  const urlResult = await fetchAdminBff<UploadUrlResponse>(
    `/api/projects/${projectId}/attachments/upload-url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      }),
    },
  )

  const putResponse = await fetch(urlResult.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })
  if (!putResponse.ok) {
    const detail = await putResponse.text().catch(() => '')
    throw new Error(
      detail.trim()
        ? `Upload failed for ${file.name}: ${detail.trim()}`
        : `Upload failed for ${file.name}`,
    )
  }

  return {
    storagePath: urlResult.storagePath,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  }
}

const STAGE_UPLOAD_CONCURRENCY = 3

export async function stageProjectFiles(
  projectId: string,
  files: File[],
): Promise<StagedProjectFile[]> {
  if (files.length === 0) return []

  const staged: StagedProjectFile[] = []
  for (let index = 0; index < files.length; index += STAGE_UPLOAD_CONCURRENCY) {
    const batch = files.slice(index, index + STAGE_UPLOAD_CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map((file) => stageSingleProjectFile(projectId, file)),
    )
    staged.push(...batchResults)
  }

  return staged
}

export async function uploadProjectFilesForRequest(
  projectId: string,
  requestId: string,
  files: File[],
  options?: { visibility?: 'CLIENT' | 'INTERNAL' },
): Promise<{ ok: boolean; message?: string }> {
  try {
    const staged = await stageProjectFiles(projectId, files)
    for (const attachment of staged) {
      await fetchAdminBff(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attachment,
          requestId,
          visibility: options?.visibility,
        }),
      })
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'File upload failed',
    }
  }
}

export async function uploadProjectFiles(
  projectId: string,
  files: File[],
  options?: { visibility?: 'CLIENT' | 'INTERNAL' },
): Promise<{ ok: boolean; message?: string; attachmentIds?: string[] }> {
  try {
    const staged = await stageProjectFiles(projectId, files)
    const attachmentIds: string[] = []
    for (const attachment of staged) {
      const created = await fetchAdminBff<ProjectAttachment>(
        `/api/projects/${projectId}/attachments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...attachment,
            visibility: options?.visibility,
          }),
        },
      )
      attachmentIds.push(created.id)
    }
    return { ok: true, attachmentIds }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'File upload failed',
    }
  }
}

export async function fetchProjectFiles(
  projectId: string,
  query?: Omit<FilesQuery, 'projectId'>,
): Promise<ClientFilesLibrary | null> {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.cursor) params.set('cursor', query.cursor)
  if (query?.limit != null) params.set('limit', String(query.limit))
  if (query?.visibility) params.set('visibility', query.visibility)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  try {
    return await fetchAdminBff<ClientFilesLibrary>(
      `/api/projects/${projectId}/files${suffix}`,
    )
  } catch {
    return null
  }
}

export async function fetchOrganizationFilesLibrary(
  organizationId: string,
  query?: FilesQuery,
): Promise<ClientFilesLibrary | null> {
  const params = new URLSearchParams()
  if (query?.projectId) params.set('projectId', query.projectId)
  if (query?.q) params.set('q', query.q)
  if (query?.cursor) params.set('cursor', query.cursor)
  if (query?.limit != null) params.set('limit', String(query.limit))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  try {
    return await fetchAdminBff<ClientFilesLibrary>(
      `/api/organizations/${organizationId}/files/library${suffix}`,
    )
  } catch {
    return null
  }
}

export async function fetchAttachmentDownloadUrl(
  attachmentId: string,
): Promise<string | null> {
  try {
    const data = await fetchAdminBff<AttachmentDownloadResponse>(
      `/api/attachments/${attachmentId}/download`,
    )
    return data.download.signedUrl
  } catch {
    return null
  }
}
