'use client'

import PortalSectionPlaceholder from '@client-portal/components/portal/section-placeholder'
import type { LucideIcon } from 'lucide-react'

type SocialListeningSectionPlaceholderProps = {
  title: string
  description: string
  icon: LucideIcon
}

export default function SocialListeningSectionPlaceholder(
  props: SocialListeningSectionPlaceholderProps,
) {
  return <PortalSectionPlaceholder {...props} />
}
