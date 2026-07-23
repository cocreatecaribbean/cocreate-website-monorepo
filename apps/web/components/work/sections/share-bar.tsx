'use client'

import {useEffect, useMemo, useState} from 'react'
import Image from 'next/image'
import type {ShareBarSection} from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import facebookBlue from '@/public/fb_blue.svg'
import linkedinBlue from '@/public/linkedin_blue.svg'

const ICON_SIZE = 32

const CIRCLE_CLASS =
  'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-casablanca hover:-translate-y-2 hover:transition-transform duration-150 ease-out transform-gpu'

type SharePlatform = {
  id: string
  label: string
  href: (url: string, title: string) => string
}

const PLATFORMS: SharePlatform[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'x',
    label: 'X',
    href: (url, title) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
]

function PlatformIcon({id}: {id: string}) {
  switch (id) {
    case 'facebook':
      return (
        <Image
          src={facebookBlue}
          alt=""
          width={ICON_SIZE}
          height={ICON_SIZE}
          aria-hidden
        />
      )
    case 'linkedin':
      return (
        <Image
          src={linkedinBlue}
          alt=""
          width={ICON_SIZE}
          height={ICON_SIZE}
          aria-hidden
        />
      )
    case 'x':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 fill-chambray"
          aria-hidden
        >
          <path d="M4 4h4.2l4.1 5.7L17.3 4H20l-6.2 7.4L20.5 20H16.2l-4.5-6.2L6.4 20H4l6.6-7.9L4 4z" />
        </svg>
      )
    default:
      return null
  }
}

type ShareBarBlockProps = {
  section: ShareBarSection
  pageUrl: string
  pageTitle: string
}

export default function ShareBarBlock({
  section,
  pageUrl,
  pageTitle,
}: ShareBarBlockProps) {
  const heading = section.heading?.trim() || 'Share on'
  const [resolvedUrl, setResolvedUrl] = useState(pageUrl)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pageUrl.startsWith('http://') || pageUrl.startsWith('https://')) {
      setResolvedUrl(pageUrl)
      return
    }
    setResolvedUrl(new URL(pageUrl, window.location.origin).toString())
  }, [pageUrl])

  const actions = useMemo(
    () =>
      PLATFORMS.map((platform) => ({
        ...platform,
        url: platform.href(resolvedUrl, pageTitle),
      })),
    [pageTitle, resolvedUrl],
  )

  return (
    <section className="flex flex-col items-center gap-6 pt-10 pb-4 md:pt-14 lg:pt-16">
      <p
        className={`text-2xl text-gradient-chambray-diagonal sm:text-3xl ${fonts.bricolage_grot700.className}`}
      >
        {heading}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-4">
        {actions.map((platform) => (
          <li key={platform.id}>
            <a
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={CIRCLE_CLASS}
              aria-label={`Share on ${platform.label}`}
            >
              <PlatformIcon id={platform.id} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
