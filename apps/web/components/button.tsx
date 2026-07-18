'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/utils/tailwind-helpers'
import * as fonts from '@/styles/fonts'

type Variants = 'primary' | 'secondary' | 'tertiary' | 'casablanca'

type CommonProps = {
  children?: React.ReactNode
  className?: string
  variant?: Variants
  asChild?: boolean
  hasIcon?: boolean
  iconSrc?: string
  iconSize?: number
  isNav?: boolean
  href?: string
  downloadName?: string
}

type ButtonProps =
  | ({ isNav?: false } & CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ isNav: true; href: string } & CommonProps &
      React.AnchorHTMLAttributes<HTMLAnchorElement>)

/** Shared hover language for casablanca CTAs (Subscribe, Send, etc.) */
export const casablancaCtaClassName = cn(
  'inline-flex items-center justify-center gap-3 rounded-full',
  'bg-casablanca text-chambray',
  'hover:-translate-y-1 hover:cursor-pointer hover:bg-amber-200 hover:text-blue-900',
  'focus:outline-none transition-all duration-300',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
  fonts.bricolage_grot600.className,
)

const baseStyle = cn(
  'inline-flex items-center justify-center gap-3 rounded-full px-6 py-5',
  'text-[1.2rem] text-background',
  'focus:outline-none hover:-translate-y-1 hover:cursor-pointer',
  'transition-all duration-300',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
  fonts.bricolage_grot600.className,
)

const variantStyles: Record<Variants, string> = {
  primary: 'bg-joh-blue hover:bg-blue-950',
  secondary: 'bg-joh-blue-secondary',
  tertiary: 'bg-background text-joh-blue',
  casablanca:
    'bg-casablanca text-chambray hover:bg-amber-200 hover:text-blue-900',
}

function Button(props: ButtonProps, ref: React.Ref<HTMLButtonElement | HTMLAnchorElement>) {
  const {
    children,
    className,
    variant = 'primary',
    hasIcon = false,
    iconSrc = '',
    iconSize = 32,
    isNav,
    href,
    downloadName,
    ...rest
  } = props

  const classes = cn(baseStyle, variantStyles[variant], className)
  const icon = hasIcon ? (
    <Image src={iconSrc} width={iconSize} height={iconSize} alt="button icon" />
  ) : null

  const asLink = Boolean(href) || isNav === true

  if (asLink && href) {
    if (downloadName) {
      return (
        <a
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          className={classes}
          download={downloadName}
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {children}
          {icon}
        </a>
      )
    }

    return (
      <Link
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        className={classes}
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
      >
        {children}
        {icon}
      </Link>
    )
  }

  return (
    <button
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={classes}
      ref={ref as React.Ref<HTMLButtonElement>}
    >
      {children}
      {icon}
    </button>
  )
}

const ButtonWithRef = React.forwardRef(Button)
ButtonWithRef.displayName = 'Button Component'
export default ButtonWithRef
