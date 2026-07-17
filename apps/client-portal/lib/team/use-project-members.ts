'use client'

import { useCallback, useState } from 'react'

import {
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
  useTransferProjectOwnershipMutation,
} from '@/lib/api/mutations/team'
import { useProjectMembersQuery } from '@/lib/api/queries/team'

export function useProjectMembers(projectId: string) {
  const { data, isLoading, error: queryError, refetch } = useProjectMembersQuery(projectId)
  const addMemberMutation = useAddProjectMemberMutation(projectId)
  const removeMemberMutation = useRemoveProjectMemberMutation(projectId)
  const transferMutation = useTransferProjectOwnershipMutation(projectId)

  const [selectedEmail, setSelectedEmail] = useState('')
  const [transferUserId, setTransferUserId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const addMember = useCallback(
    async (email: string) => {
      setError(null)
      try {
        await addMemberMutation.mutateAsync({ email })
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

  const transferOwnership = useCallback(
    async (newOwnerUserId: string) => {
      setError(null)
      try {
        await transferMutation.mutateAsync({ newOwnerUserId })
        setTransferUserId('')
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not transfer ownership')
        return false
      }
    },
    [transferMutation],
  )

  const assignableMembers = data?.assignableMembers ?? []
  const stillValid = assignableMembers.some((m) => m.email === selectedEmail)

  return {
    members: data?.members ?? [],
    assignableMembers,
    creatorEmail: data?.creator.email ?? null,
    ownerUserId: data?.ownerUserId ?? null,
    ownerEmail: data?.ownerEmail ?? null,
    viewerIsOwner: data?.viewerIsOwner ?? false,
    canTransferOwnership: data?.canTransferOwnership ?? false,
    canManage: data?.canManage ?? false,
    loading: isLoading,
    error: error ?? (queryError instanceof Error ? queryError.message : null),
    submitting:
      addMemberMutation.isPending ||
      removeMemberMutation.isPending ||
      transferMutation.isPending,
    selectedEmail: stillValid ? selectedEmail : '',
    setSelectedEmail,
    transferUserId,
    setTransferUserId,
    addMember,
    removeMember,
    transferOwnership,
    reload: () => void refetch(),
  }
}
