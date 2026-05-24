import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sanmarino">
          CoCreate Caribbean
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-chambray">Admin Center</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Manage client portal access, review assignments, and configure internal tools.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/client-access"
          className="rounded-3xl border border-chambray/10 bg-white p-6 shadow-sm transition hover:border-sanmarino/30 hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-chambray">Client portal access</h2>
          <p className="mt-2 text-sm text-slate-600">
            Assign or revoke email addresses that can sign in to the client portal.
          </p>
        </Link>
      </section>
    </main>
  )
}
