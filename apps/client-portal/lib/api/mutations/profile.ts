'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'

const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

export function resolveAvatarMimeType(fileName: string, fileType: string): string {
  const trimmed = fileType.trim().toLowerCase()
  if (ALLOWED_AVATAR_MIME.includes(trimmed as (typeof ALLOWED_AVATAR_MIME)[number])) {
    return trimmed
  }

  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'

  throw new Error('Avatar must be a JPEG, PNG, or WebP image (max 5 MB)')
}

async function portalBff<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getPortalAccessToken()
  if (!token) throw new Error('Not signed in')

  const response = await fetch(`/api/client-portal/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string }).message)
        : `Request failed (${response.status})`,
    )
  }
  return data as T
}

export function useUpdatePortalAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const mimeType = resolveAvatarMimeType(file.name, file.type)

      const urlRes = await portalBff<{
        ok: boolean
        storagePath?: string
        signedUrl?: string
      }>('profile/avatar/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.signedUrl || !urlRes.storagePath) {
        throw new Error('Upload URL missing from server response')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: file,
      })
      if (!upload.ok) {
        throw new Error(`Upload failed (HTTP ${upload.status})`)
      }

      return portalBff<{ ok: boolean; profile?: { avatarUrl?: string | null } }>(
        'profile/avatar',
        {
          method: 'PATCH',
          body: JSON.stringify({ storagePath: urlRes.storagePath }),
        },
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.portal() })
    },
  })
}

export function useDeletePortalAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      portalBff<{ ok: boolean }>('profile/avatar', { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.portal() })
    },
  })
}

export function useUpdatePortalProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { displayName: string }) =>
      portalBff<{ ok: boolean }>('profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.portal() })
    },
  })
}

export function useUpdateOrganizationLogoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const urlRes = await portalBff<{
        signedUrl?: string
        publicUrl?: string
        storagePath?: string
      }>('organization/logo/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.signedUrl || !urlRes.storagePath) {
        throw new Error('Upload URL missing from server response')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!upload.ok) {
        throw new Error(`Upload failed (HTTP ${upload.status})`)
      }

      return portalBff<{ ok: boolean; organization?: { logoUrl?: string | null } }>(
        'organization/logo',
        {
          method: 'PATCH',
          body: JSON.stringify({ storagePath: urlRes.storagePath }),
        },
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.portal() })
    },
  })
}

export function useDeleteOrganizationLogoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      portalBff<{ ok: boolean }>('organization/logo', { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.portal() })
    },
  })
}
