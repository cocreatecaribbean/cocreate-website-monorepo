'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { bricolage_grot600 } from '@/styles/fonts'

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

type ThemeToggleProps = {
  variant?: 'sidebar' | 'settings'
}

export default function ThemeToggle({ variant = 'sidebar' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-9 rounded-xl bg-white/5" aria-hidden />
  }

  const isSidebar = variant === 'sidebar'

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
      <div
        className={`flex gap-1 rounded-xl p-1 ${isSidebar ? 'bg-white/8' : 'border border-app bg-app-input'}`}
        role="group"
        aria-label="Color theme"
      >
        {options.map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`
                flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs transition
                ${bricolage_grot600.className}
                ${
                  isSidebar
                    ? active
                      ? 'bg-white/18 text-casablanca'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    : active
                      ? 'bg-chambray/15 text-chambray dark:bg-white/12 dark:text-casablanca dark:ring-1 dark:ring-casablanca/30'
                      : 'text-app-muted hover:bg-chambray/5 dark:hover:bg-white/8'
                }
              `}
              aria-pressed={active}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className={isSidebar ? 'sr-only sm:not-sr-only' : ''}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
