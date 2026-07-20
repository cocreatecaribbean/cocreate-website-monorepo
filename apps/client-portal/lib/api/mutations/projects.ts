'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  createProject,
  registerProjectCover,
  removeProjectCover,
  renameProject,
  requestProjectCoverUploadUrl,
  uploadProjectFiles,
} from '@/lib/projects/fetch-projects-client'

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { title: string; description: string }) => createProject(payload),
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useRenameProjectMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title: string) => {
      const result = await renameProject(projectId, title)
      if (!result.ok) throw new Error(result.message ?? 'Could not rename project')
      return result.project
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useCreateProjectWithFilesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      title,
      description,
      files,
    }: {
      title: string
      description: string
      files?: File[]
    }) => {
      const result = await createProject({ title, description })
      if (!result.ok || !result.project) {
        return { ok: false as const, message: result.message }
      }
      if (files?.length) {
        const upload = await uploadProjectFiles(result.project.id, files)
        if (!upload.ok) {
          return {
            ok: true as const,
            project: result.project,
            uploadError: upload.message ?? 'Project created but upload failed',
          }
        }
      }
      return { ok: true as const, project: result.project }
    },
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.files.all })
    },
  })
}

export function useUpdateProjectCoverMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const urlResult = await requestProjectCoverUploadUrl(projectId, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      })
      if (!urlResult.ok) throw new Error(urlResult.message)

      const putResponse = await fetch(urlResult.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!putResponse.ok) throw new Error('Upload failed')

      const reg = await registerProjectCover(projectId, {
        storagePath: urlResult.data.storagePath,
      })
      if (!reg.ok) throw new Error(reg.message)
      return reg.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useRemoveProjectCoverMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await removeProjectCover(projectId)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
