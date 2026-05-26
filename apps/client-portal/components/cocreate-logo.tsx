'use client'

import Image from 'next/image'
import Link from 'next/link'

type CoCreateLogoProps = {
  href?: string
  className?: string
  priority?: boolean
}

export default function CoCreateLogo({
  href = '/',
  className = 'h-8 w-auto sm:h-9',
  priority = false,
}: CoCreateLogoProps) {
  const image = (
    <>
      <Image
        src="/co_create_logo_hor_blue.svg"
        alt="CoCreate Caribbean"
        width={140}
        height={36}
        className={`${className} dark:hidden`}
        priority={priority}
      />
      <Image
        src="/co_create_logo_hor_wht.svg"
        alt="CoCreate Caribbean"
        width={140}
        height={36}
        className={`${className} hidden dark:block`}
        priority={priority}
      />
    </>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    )
  }

  return <span className="inline-flex shrink-0 items-center">{image}</span>
}
