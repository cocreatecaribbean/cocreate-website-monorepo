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
    <div className="admin-alert-warn mt-4">
      <p className="font-medium">Development sign-in (no email)</p>
      <p className="mt-1 text-xs opacity-90">
        Supabase email rate limits are skipped in local dev. Click once — links are
        single-use.
      </p>
      <a
        href={url}
        className="mt-3 inline-flex break-all text-sm font-semibold underline"
      >
        {label}
      </a>
    </div>
  )
}
