import type { PlaceholderDataFunction } from '@tanstack/react-query'

export const THREAD_STALE_MS = 2 * 60 * 1000

export function threadQueryOptions<T>(_options?: unknown) {
  return {
    staleTime: THREAD_STALE_MS,
    placeholderData: ((previous: T | undefined) => previous) as PlaceholderDataFunction<T>,
    refetchInterval: false as const,
    refetchIntervalInBackground: false as const,
  }
}
