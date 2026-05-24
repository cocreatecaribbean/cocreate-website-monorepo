'use client'

type DevSignInLinkProps = {
  url: string
  label?: string
}

export default function DevSignInLink({
  url,
  label = 'Open sign-in link',
}: DevSignInLinkProps) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Development sign-in (no email)</p>
      <p className="mt-1 text-xs text-amber-900/80">
        Supabase email rate limits are skipped in local dev. Click once — links are
        single-use.
      </p>
      <a
        href={url}
        className="mt-3 inline-flex break-all text-sm font-semibold text-chambray underline"
      >
        {label}
      </a>
    </div>
  )
}
