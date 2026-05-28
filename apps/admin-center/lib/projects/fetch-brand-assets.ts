import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type { OrganizationBrandAsset } from '@/lib/projects/types'

type UploadUrlResponse = {
  storagePath: string
  signedUrl: string
  token: string
  expiresIn: number
}

type AttachmentDownloadResponse = {
  id: string
  fileName: string
  mimeType: string
  download: { signedUrl: string }
}

export async function fetchBrandAssets(
  organizationId: string,
): Promise<OrganizationBrandAsset[] | null> {
  try {
    return await fetchAdminBff<OrganizationBrandAsset[]>(
      `/api/organizations/${organizationId}/brand-assets`,
    )
  } catch {
    return null
  }
}

export async function fetchBrandAssetDownloadUrl(assetId: string): Promise<string | null> {
  try {
    const data = await fetchAdminBff<AttachmentDownloadResponse>(
      `/api/brand-assets/${assetId}/download`,
    )
    return data.download?.signedUrl ?? null
  } catch {
    return null
  }
}

export async function uploadBrandAssets(
  organizationId: string,
  files: File[],
): Promise<{ ok: boolean; message?: string }> {
  try {
    for (const file of files) {
      const urlResult = await fetchAdminBff<UploadUrlResponse>(
        `/api/organizations/${organizationId}/brand-assets/upload-url`,
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
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!putResponse.ok) {
        const detail = await putResponse.text().catch(() => '')
        return {
          ok: false,
          message: detail.trim()
            ? `Upload failed for ${file.name}: ${detail.trim()}`
            : `Upload failed for ${file.name}`,
        }
      }

      await fetchAdminBff(`/api/organizations/${organizationId}/brand-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storagePath: urlResult.storagePath,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        }),
      })
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

export async function deleteBrandAsset(assetId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await fetchAdminBff(`/api/brand-assets/${assetId}`, { method: 'DELETE' })
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not delete file',
    }
  }
}
