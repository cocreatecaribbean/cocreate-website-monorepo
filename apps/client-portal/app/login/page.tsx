import Link from 'next/link'

type LoginPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function ClientPortalLoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams
  const email = params.email?.trim() ?? ''

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-sanmarino">
        Client Portal
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-chambray">Sign in</h1>

      {email ? (
        <p className="mt-4 text-base text-slate-700">
          Access confirmed for{' '}
          <span className="font-semibold text-chambray">{email}</span>.
        </p>
      ) : (
        <p className="mt-4 text-base text-slate-600">
          Use the Client Portal link on the CoCreate website and enter your assigned email.
        </p>
      )}

      <p className="mt-4 text-sm text-slate-500">
        Full authentication (magic link or password) will be added here. For now this confirms
        your email is on the allow list.
      </p>

      <Link
        href={email ? `/?email=${encodeURIComponent(email)}` : '/'}
        className="mt-8 inline-flex w-fit rounded-full bg-chambray px-6 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino"
      >
        Continue to portal
      </Link>
    </main>
  )
}
