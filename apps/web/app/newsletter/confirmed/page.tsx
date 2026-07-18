import ButtonWithRef from '@/components/button'
import * as fonts from '@/styles/fonts'

export default function NewsletterConfirmedPage() {
  return (
    <main
      className={`flex min-h-svh flex-col items-center justify-center bg-chambray px-6 py-16 text-white ${fonts.bricolage_grot400.className}`}
    >
      <div className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-casablanca">Newsletter</p>
        <h1 className={`mt-4 text-3xl sm:text-4xl ${fonts.alkatra600.className}`}>
          You&apos;re subscribed
        </h1>
        <p className="mt-4 text-lg text-white/85">
          Thanks for confirming. You&apos;ll hear from CoCreate Caribbean with inspiration,
          updates, and news.
        </p>
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
