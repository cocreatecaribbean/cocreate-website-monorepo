'use client'

import { SocialListeningPanel as BaseSocialListeningPanel } from '@cocreate/social-listening/ui'
import type { ComponentProps } from 'react'
import { clientSocialListeningDataSource } from '@/lib/social-listening/client-data-source'

type SocialListeningPanelProps = Omit<
  ComponentProps<typeof BaseSocialListeningPanel>,
  'dataSource'
> & {
  dataSource?: ComponentProps<typeof BaseSocialListeningPanel>['dataSource']
}

export default function SocialListeningPanel({
  dataSource = clientSocialListeningDataSource,
  ...props
}: SocialListeningPanelProps) {
  return <BaseSocialListeningPanel dataSource={dataSource} {...props} />
}
