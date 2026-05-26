import { Suspense } from 'react'
import ClientPortalLoginForm from '@/components/client-login-form'

export default function ClientPortalLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
          <p className="text-sm text-app-muted">Loading…</p>
        </main>
      }
    >
      <ClientPortalLoginForm />
    </Suspense>
  )
}
