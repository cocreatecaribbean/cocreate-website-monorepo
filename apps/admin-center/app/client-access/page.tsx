import Link from 'next/link'
import ClientAccessManager from '@/components/client-access-manager'

export default function ClientAccessPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm font-medium text-sanmarino hover:underline">
        ← Admin Center
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-chambray">Client portal access</h1>
      <p className="mt-2 text-sm text-slate-600">
        Only emails listed here can sign in from the public site&apos;s Client Portal menu.
      </p>
      <ClientAccessManager />
    </main>
  )
}
