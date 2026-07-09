'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import type { ChartConfig } from './chart'
import { getPortalChartCssVars, getReachEngagementChartConfig } from './chart-theme'

export function usePortalChartCssVars() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return useMemo(() => getPortalChartCssVars(isDark), [isDark])
}

export function useReachEngagementChartConfig(): ChartConfig {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return useMemo(() => getReachEngagementChartConfig(isDark), [isDark])
}
