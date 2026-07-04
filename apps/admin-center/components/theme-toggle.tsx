'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { patchAdminPreferences } from '@/lib/api/mutations/preferences'
import { bricolage_grot600 } from '@/styles/fonts'

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

type ThemeToggleProps = {
  variant?: 'sidebar' | 'settings' | 'header'
}

export default function ThemeToggle({ variant = 'sidebar' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [])

  const selectTheme = (value: (typeof options)[number]['value']) => {
    setTheme(value)
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      void patchAdminPreferences({ theme: value })
    }, 300)
  }

  const isSidebar = variant === 'sidebar'
  const isHeader = variant === 'header'

  if (!mounted) {
    return (
      <div
        className={
          isHeader
            ? 'h-9 w-[7.5rem] rounded-xl border border-chambray/10 bg-chambray/4 dark:border-white/10 dark:bg-white/5'
            : isSidebar
              ? 'h-9 rounded-xl bg-white/5'
              : 'h-9 rounded-xl border border-app bg-app-input dark:bg-white/8'
        }
        aria-hidden
      />
    )
  }

  const control = (
    <div
      className={`flex gap-1 rounded-xl p-1 ${
        isSidebar
          ? 'bg-white/8'
          : isHeader
            ? 'border border-chambray/10 bg-chambray/[0.04] dark:border-white/10 dark:bg-white/5'
            : 'border border-app bg-app-input dark:bg-white/8'
      }`}
      role="group"
      aria-label="Color theme"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => selectTheme(value)}
            title={label}
            className={`
              flex items-center justify-center gap-1.5 rounded-lg text-xs transition
              ${bricolage_grot600.className}
              ${
                isHeader
                  ? `h-8 w-8 sm:h-auto sm:w-auto sm:flex-1 sm:px-2 sm:py-2 ${
                      active
                        ? 'bg-chambray/15 text-chambray dark:bg-white/15 dark:text-casablanca dark:ring-1 dark:ring-casablanca/40'
                        : 'text-app-muted hover:bg-chambray/5 dark:text-white/70 dark:hover:bg-white/8'
                    }`
                  : `flex flex-1 px-2 py-2 ${
                      isSidebar
                        ? active
                          ? 'bg-white/18 text-casablanca'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                        : active
                          ? 'bg-chambray/15 text-chambray dark:bg-white/15 dark:text-casablanca dark:ring-1 dark:ring-casablanca/40'
                          : 'text-app-muted hover:bg-chambray/5 dark:text-white/70 dark:hover:bg-white/8'
                    }`
              }
            `}
            aria-pressed={active}
            aria-label={label}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className={isSidebar || isHeader ? 'sr-only sm:not-sr-only' : ''}>{label}</span>
          </button>
        )
      })}
    </div>
  )

  if (isHeader) {
    return control
  }

  return (
    <div className={isSidebar ? 'space-y-2' : 'space-y-3'}>
      {isSidebar ? (
        <p
          className={`px-1 text-[0.65rem] font-semibold tracking-[0.18em] text-white/45 uppercase ${bricolage_grot600.className}`}
        >
          Appearance
        </p>
      ) : (
        <p className={`text-sm font-medium text-app-primary ${bricolage_grot600.className}`}>
          Appearance
        </p>
      )}
      {control}
    </div>
  )
}
