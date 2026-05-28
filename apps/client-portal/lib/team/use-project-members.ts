'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  addProjectMember,
  fetchProjectMembers,
  removeProjectMember,
  type AssignableProjectMember,
  type ClientProjectAccessLevel,
  type ProjectMember,
} from '@/lib/team/fetch-team-client'

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [assignableMembers, setAssignableMembers] = useState<AssignableProjectMember[]>([])
  const [creatorEmail, setCreatorEmail] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState('')
  const [access, setAccess] = useState<ClientProjectAccessLevel>('VIEW')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProjectMembers(projectId)
      setMembers(data.members)
      setAssignableMembers(data.assignableMembers ?? [])
      setCreatorEmail(data.creator.email)
      setCanManage(data.canManage)
      setSelectedEmail((current) => {
        const stillValid = (data.assignableMembers ?? []).some((m) => m.email === current)
        return stillValid ? current : ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const addMember = useCallback(
    async (email: string, accessLevel: ClientProjectAccessLevel) => {
      setSubmitting(true)
      setError(null)
      try {
        await addProjectMember(projectId, { email, access: accessLevel })
        setSelectedEmail('')
        await load()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add member')
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [projectId, load],
  )

  const removeMember = useCallback(
    async (userId: string) => {
      setError(null)
      try {
        await removeProjectMember(projectId, userId)
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove member')
      }
    },
    [projectId, load],
  )

  return {
    members,
    assignableMembers,
    creatorEmail,
    canManage,
    loading,
    error,
    submitting,
    selectedEmail,
    setSelectedEmail,
    access,
    setAccess,
    addMember,
    removeMember,
    reload: load,
  }
}
