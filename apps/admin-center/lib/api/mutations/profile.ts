'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { AdminApiFetchError, fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { AdminProfile } from '@/lib/projects/api-types'

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

export function useUpdateAdminProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { displayName: string; jobTitleOptionIds: string[] }) =>
      fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.profile.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.session.all })
    },
  })
}

export function useUpdateAdminAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const mimeType = resolveAvatarMimeType(file.name, file.type)

      let urlRes: { ok: boolean; storagePath?: string; signedUrl?: string }
      try {
        urlRes = await fetchAdminBff<{
          ok: boolean
          storagePath?: string
          signedUrl?: string
        }>('/api/profile/avatar/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType,
            sizeBytes: file.size,
          }),
        })
      } catch (error) {
        if (error instanceof AdminApiFetchError) {
          throw new Error(error.message)
        }
        throw error
      }

      if (!urlRes.signedUrl || !urlRes.storagePath) {
        throw new Error('Upload URL missing from server response')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: file,
      })
      if (!upload.ok) {
        const detail = await upload.text().catch(() => '')
        throw new Error(
          detail.trim()
            ? `Upload failed: ${detail.trim()}`
            : `Upload failed (HTTP ${upload.status})`,
        )
      }

      try {
        return await fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>(
          '/api/profile/avatar',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePath: urlRes.storagePath }),
          },
        )
      } catch (error) {
        if (error instanceof AdminApiFetchError) {
          throw new Error(error.message)
        }
        throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.profile.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.session.all })
    },
  })
}

export function useCreateProfileOptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { label: string }) =>
      fetchAdminBff('/api/settings/profile-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.profile.settingsOptions() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.profile.options() })
    },
  })
}

export function useDeleteProfileOptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchAdminBff<{ ok?: boolean; removed?: boolean; deactivated?: boolean }>(
        `/api/settings/profile-options/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.profile.settingsOptions() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.profile.options() })
    },
  })
}
