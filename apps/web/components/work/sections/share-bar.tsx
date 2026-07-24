'use client'

import {useEffect, useMemo, useState} from 'react'
import type {ShareBarSection} from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import {headlineFillStyle} from '@/components/work/sections/headline-fill-style'

const ICON_SIZE_CLASS = 'h-8 w-8'

const CIRCLE_BASE_CLASS =
  'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full hover:-translate-y-2 hover:transition-transform duration-150 ease-out transform-gpu'

const DEFAULT_HEADING_CLASS = 'text-gradient-chambray-diagonal'

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
        <svg viewBox="0 0 200 200" className={ICON_SIZE_CLASS} aria-hidden fill="currentColor">
          <path d="M183.22,100.3c0-45.96-37.26-83.22-83.22-83.22S16.78,54.35,16.78,100.3c0,39.03,26.87,71.77,63.11,80.76v-55.34h-17.16v-25.43h17.16v-10.96c0-28.32,12.82-41.45,40.62-41.45,5.27,0,14.37,1.03,18.09,2.07v23.05c-1.96-.21-5.38-.31-9.61-.31-13.65,0-18.92,5.17-18.92,18.61v8.99h27.18l-4.67,25.43h-22.51v57.18c41.2-4.98,73.13-40.06,73.13-82.61Z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 200 200" className={ICON_SIZE_CLASS} aria-hidden fill="currentColor">
          <path d="M164.81,21.98H35.19c-7.29,0-13.2,5.91-13.2,13.2v129.63c0,7.29,5.91,13.2,13.2,13.2h129.63c7.29,0,13.2-5.91,13.2-13.2V35.19c0-7.29-5.91-13.2-13.2-13.2ZM68.44,157.68h-23.81v-76.91h23.81v76.91ZM56.42,70.7c-7.78,0-14.08-6.36-14.08-14.2s6.3-14.19,14.08-14.19,14.08,6.35,14.08,14.19-6.3,14.2-14.08,14.2ZM157.66,157.68h-23.7v-40.37c0-11.07-4.21-17.25-12.96-17.25-9.53,0-14.51,6.44-14.51,17.25v40.37h-22.84v-76.91h22.84v10.36s6.86-12.71,23.18-12.71,27.98,9.96,27.98,30.56v48.7Z" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={ICON_SIZE_CLASS} aria-hidden fill="currentColor">
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
  const {className: headingFillClass, style: headingFillStyle} = headlineFillStyle(
    section.headingFill,
    DEFAULT_HEADING_CLASS,
  )
  const circleStyle = section.circleColor
    ? {backgroundColor: section.circleColor}
    : undefined
  const iconStyle = section.iconColor ? {color: section.iconColor} : undefined
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
        className={`text-2xl sm:text-3xl ${fonts.bricolage_grot700.className} ${headingFillClass}`}
        style={headingFillStyle}
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
              className={`${CIRCLE_BASE_CLASS} ${section.circleColor ? '' : 'bg-casablanca'} ${section.iconColor ? '' : 'text-chambray'}`}
              style={{...circleStyle, ...iconStyle}}
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
