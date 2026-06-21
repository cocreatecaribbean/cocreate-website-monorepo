'use client'

import { useMemo } from 'react'
import SocialListeningPanel from '@client-portal/components/social-listening/social-listening-panel'
import type { SocialListeningAnalyticsPayload } from '@client-portal/lib/social-listening/api-types'
import { createAdminSocialListeningDataSource } from '@/lib/social-listening/admin-data-source'

type SocialListeningAdminAnalyticsViewProps = {
  organizationId: string
  organizationName: string
  initialAnalytics: SocialListeningAnalyticsPayload
}

export default function SocialListeningAdminAnalyticsView({
  organizationId,
  organizationName,
  initialAnalytics,
}: SocialListeningAdminAnalyticsViewProps) {
  const dataSource = useMemo(
    () => createAdminSocialListeningDataSource(organizationId),
    [organizationId],
  )

  return (
    <SocialListeningPanel
      initialAnalytics={initialAnalytics}
      organizationName={organizationName}
      dataSource={dataSource}
      variant="admin"
      adminBanner={`Viewing as CoCreate admin · ${organizationName}`}
      showSetup={false}
      showSettings={false}
    />
  )
}
