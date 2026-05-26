'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { getNivoTheme } from '@/components/social-listening/nivo-theme'

export function useNivoTheme() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return useMemo(() => {
    if (!mounted) return getNivoTheme(false)
    return getNivoTheme(resolvedTheme === 'dark')
  }, [mounted, resolvedTheme])
}
