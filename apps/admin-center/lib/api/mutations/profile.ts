'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { AdminProfile } from '@/lib/projects/api-types'

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
      const urlRes = await fetchAdminBff<{
        ok: boolean
        storagePath?: string
        signedUrl?: string
      }>('/api/profile/avatar/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.signedUrl || !urlRes.storagePath) {
        throw new Error('Upload URL missing')
      }

      const upload = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!upload.ok) throw new Error('Upload failed')

      return fetchAdminBff<{ ok: boolean; profile?: AdminProfile }>('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: urlRes.storagePath }),
      })
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
