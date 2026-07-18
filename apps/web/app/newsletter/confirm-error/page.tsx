import ButtonWithRef from '@/components/button'
import * as fonts from '@/styles/fonts'

const messages: Record<string, string> = {
  missing: 'This confirmation link is incomplete.',
  invalid: 'This confirmation link is invalid or has already been used.',
  expired:
    'This confirmation link has expired. Please subscribe again from our site footer.',
  sync: 'We confirmed your interest, but syncing to our mailing list failed. Please try again later or contact us.',
}

type PageProps = {
  searchParams: Promise<{ reason?: string }>
}

export default async function NewsletterConfirmErrorPage({ searchParams }: PageProps) {
  const { reason } = await searchParams
  const message = messages[reason ?? ''] ?? messages.invalid

  return (
    <main
      className={`flex min-h-svh flex-col items-center justify-center bg-chambray px-6 py-16 text-white ${fonts.bricolage_grot400.className}`}
    >
      <div className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-casablanca">Newsletter</p>
        <h1 className={`mt-4 text-3xl sm:text-4xl ${fonts.alkatra600.className}`}>
          Could not confirm
        </h1>
        <p className="mt-4 text-lg text-white/85">{message}</p>
        <ButtonWithRef
          href="/"
          isNav
          variant="casablanca"
          className="mt-8 px-8 py-3 text-base"
        >
          Back to home
        </ButtonWithRef>
      </div>
    </main>
  )
}
