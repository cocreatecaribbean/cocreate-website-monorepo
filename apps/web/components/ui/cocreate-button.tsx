'use client'

import Link from 'next/link'
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type ReactNode,
} from 'react'
import * as fonts from '@/styles/fonts'
import { cn } from '@/utils/tailwind-helpers'

const sizeStyles = {
  md: 'px-8 py-3.5 text-[0.95rem] min-[1024px]:px-10 min-[1024px]:py-4 min-[1024px]:text-base',
  lg: 'px-10 py-4 text-lg min-[1024px]:px-12 min-[1024px]:py-[1.15rem] min-[1024px]:text-xl',
} as const

const baseClassName = cn(
  'group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full',
  'text-white',
  'bg-[linear-gradient(105deg,#2f3a8f_0%,#3d52a8_38%,#4f6fbb_62%,#6a9ad8_100%)]',
  'bg-size-[160%_100%] bg-left',
  'ring-1 ring-inset ring-white/15',
  'transition-[transform,background-position,filter] duration-400 ease-out',
  'hover:-translate-y-0.5 hover:bg-right',
  'active:translate-y-0 active:brightness-[0.98]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sanmarino',
  'disabled:pointer-events-none disabled:opacity-55',
  fonts.bricolage_grot600.className,
)

type CoCreateButtonBaseProps = {
  children: ReactNode
  className?: string
  size?: keyof typeof sizeStyles
}

type CoCreateButtonAsButton = CoCreateButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type CoCreateButtonAsLink = CoCreateButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string
  }

export type CoCreateButtonProps = CoCreateButtonAsButton | CoCreateButtonAsLink

function CoCreateButtonInner(
  { children, className, size = 'lg', ...props }: CoCreateButtonProps,
  ref: ForwardedRef<HTMLButtonElement | HTMLAnchorElement>,
) {
  const classes = cn(baseClassName, sizeStyles[size], className)

  const label = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/14 via-white/5 to-transparent"
      />
      <span className="relative z-10 whitespace-nowrap tracking-[0.01em]">
        {children}
      </span>
    </>
  )

  if ('href' in props && props.href) {
    const { href, ...linkProps } = props
    const isExternal =
      href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')

    if (isExternal) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...linkProps}
        >
          {label}
        </a>
      )
    }

    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...linkProps}
      >
        {label}
      </Link>
    )
  }

  const { type = 'button', ...buttonProps } = props as CoCreateButtonAsButton

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={classes}
      {...buttonProps}
    >
      {label}
    </button>
  )
}

const CoCreateButton = forwardRef(CoCreateButtonInner)
CoCreateButton.displayName = 'CoCreateButton'

export default CoCreateButton
