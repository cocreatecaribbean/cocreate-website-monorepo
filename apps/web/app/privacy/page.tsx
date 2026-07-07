import type { Metadata } from 'next'
import LegalPage from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | CoCreate Caribbean',
  description: 'Privacy and cookie information for CoCreate Caribbean.',
}

export default function PrivacyPage() {
  return <LegalPage />
}
