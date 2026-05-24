import { Suspense } from 'react'
import AdminLoginForm from '@/components/admin-login-form'

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-[#eef1f8] px-6">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
