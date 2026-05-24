import Link from 'next/link'

export default function ClientPortalHomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-sanmarino">
        CoCreate Caribbean
      </p>
      <h1 className="mt-2 text-4xl font-semibold text-chambray">Client Portal</h1>
      <p className="mt-4 text-base text-slate-600">
        Your project workspace will live here — files, updates, and approvals.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Sign in from the main site using the email address assigned by your CoCreate team.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex w-fit rounded-full bg-chambray px-6 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino"
      >
        Go to sign in
      </Link>
    </main>
  )
}
