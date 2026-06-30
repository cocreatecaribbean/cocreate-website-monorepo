'use client'

import { useMemo } from 'react'
import { SocialListeningPanel } from '@cocreate/social-listening/ui'
import type { SocialListeningAnalyticsPayload } from '@cocreate/api-contracts/v1/social-listening'
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
