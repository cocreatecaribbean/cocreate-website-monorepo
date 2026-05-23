import Link from 'next/link'
import * as fonts from '@/styles/fonts'

type ViewAllWorkLinkProps = {
  className?: string
}

export default function ViewAllWorkLink({ className = '' }: ViewAllWorkLinkProps) {
  return (
    <Link
      href="/work"
      className={`
        block w-fit text-sm uppercase tracking-[0.1em] text-sanmarino
        transition-opacity hover:opacity-70
        min-[1024px]:text-base
        ${fonts.bricolage_grot500.className}
        ${className}
      `}
    >
      View all work
    </Link>
  )
}
