'use client'

import { useCallback, useState } from 'react'

import {
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
} from '@/lib/api/mutations/team'
import { useProjectMembersQuery } from '@/lib/api/queries/team'
import type {
  ClientProjectAccessLevel,
} from '@/lib/team/fetch-team-client'

export function useProjectMembers(projectId: string) {
  const { data, isLoading, error: queryError, refetch } = useProjectMembersQuery(projectId)
  const addMemberMutation = useAddProjectMemberMutation(projectId)
  const removeMemberMutation = useRemoveProjectMemberMutation(projectId)

  const [selectedEmail, setSelectedEmail] = useState('')
  const [access, setAccess] = useState<ClientProjectAccessLevel>('VIEW')
  const [error, setError] = useState<string | null>(null)

  const addMember = useCallback(
    async (email: string, accessLevel: ClientProjectAccessLevel) => {
      setError(null)
      try {
        await addMemberMutation.mutateAsync({ email, access: accessLevel })
        setSelectedEmail('')
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add member')
        return false
      }
    },
    [addMemberMutation],
  )

  const removeMember = useCallback(
    async (userId: string) => {
      setError(null)
      try {
        await removeMemberMutation.mutateAsync(userId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove member')
      }
    },
    [removeMemberMutation],
  )

  const assignableMembers = data?.assignableMembers ?? []
  const stillValid = assignableMembers.some((m) => m.email === selectedEmail)

  return {
    members: data?.members ?? [],
    assignableMembers,
    creatorEmail: data?.creator.email ?? null,
    canManage: data?.canManage ?? false,
    loading: isLoading,
    error: error ?? (queryError instanceof Error ? queryError.message : null),
    submitting: addMemberMutation.isPending || removeMemberMutation.isPending,
    selectedEmail: stillValid ? selectedEmail : '',
    setSelectedEmail,
    access,
    setAccess,
    addMember,
    removeMember,
    reload: () => void refetch(),
  }
}
