import { Suspense } from 'react'
import CollaboratorLoginForm from '@/components/collaborator-login-form'

export default function CollaboratorLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center px-6">
          <p className="text-sm text-app-muted">Loading…</p>
        </main>
      }
    >
      <CollaboratorLoginForm />
    </Suspense>
  )
}
