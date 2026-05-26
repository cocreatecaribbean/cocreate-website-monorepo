import { fetchAdminBff } from '@/lib/admin-api-fetch'

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

/** Upload bytes to storage only; register later via checkpoint API. */
export async function stageProjectFiles(
  projectId: string,
  files: File[],
): Promise<StagedProjectFile[]> {
  const staged: StagedProjectFile[] = []

  for (const file of files) {
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

    staged.push({
      storagePath: urlResult.storagePath,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    })
  }

  return staged
}

export async function uploadProjectFilesForRequest(
  projectId: string,
  requestId: string,
  files: File[],
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
