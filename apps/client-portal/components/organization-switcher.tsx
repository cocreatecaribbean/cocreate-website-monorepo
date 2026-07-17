'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { nestApiUrl } from '@cocreate/api-client'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { queryKeys } from '@/lib/api/query-keys'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'
import {
  portalAuthHeaders,
  setActiveOrganizationId,
} from '@/lib/api/active-organization'
import { bricolage_grot600 } from '@/styles/fonts'

export default function OrganizationSwitcher() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: profile } = usePortalProfileQuery()
  const [pending, setPending] = useState(false)

  const memberships = profile?.memberships ?? []
  if (memberships.length < 2) return null

  const activeId = profile?.organization?.id ?? ''

  const onChange = async (organizationId: string) => {
    if (!organizationId || organizationId === activeId) return
    setPending(true)
    try {
      const token = await getPortalAccessToken()
      if (!token) return
      const response = await fetch(nestApiUrl('/client-portal/active-organization'), {
        method: 'POST',
        headers: portalAuthHeaders(token, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ organizationId }),
      })
      if (!response.ok) {
        throw new Error('Could not switch organization')
      }
      setActiveOrganizationId(organizationId)
      await queryClient.invalidateQueries()
      router.refresh()
    } catch {
      // keep current org
    } finally {
      setPending(false)
    }
  }

  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="sr-only">Organization</span>
      <select
        value={activeId}
        disabled={pending}
        onChange={(e) => void onChange(e.target.value)}
        className={`portal-input max-w-[14rem] truncate text-sm ${bricolage_grot600.className}`}
        aria-label="Switch organization"
      >
        {memberships.map((m) => (
          <option key={m.organizationId} value={m.organizationId}>
            {m.organizationName}
          </option>
        ))}
      </select>
    </label>
  )
}
