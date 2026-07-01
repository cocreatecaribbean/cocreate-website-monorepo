import { Suspense } from 'react'
import AdminMessagesPageContent from './messages-page-content'

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-app-muted">Loading messages…</p>}>
      <AdminMessagesPageContent />
    </Suspense>
  )
}
