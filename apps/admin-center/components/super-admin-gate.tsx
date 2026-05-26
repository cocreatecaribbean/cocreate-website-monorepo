'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useAdminSession } from '@/components/admin-session-provider'
import { isSuperAdminSession } from '@/lib/admin-session'

export default function SuperAdminGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAdminSession()

  if (loading) {
    return <p className="text-sm text-slate-500">Checking access…</p>
  }

  if (!isSuperAdminSession(session?.role ?? null)) {
    return (
      <div className="admin-alert rounded-xl border border-chambray/10 bg-white px-4 py-4 text-sm text-chambray">
        <p className="font-medium">Super admin access required</p>
        <p className="mt-2 text-slate-600">
          Only super admins can manage the agency job title list. Ask a super admin to update
          titles, or use your profile page to pick from existing options.
        </p>
        <p className="mt-3">
          <Link href="/profile" className="text-chambray underline underline-offset-2">
            Go to profile
          </Link>
        </p>
      </div>
    )
  }

  return <>{children}</>
}
