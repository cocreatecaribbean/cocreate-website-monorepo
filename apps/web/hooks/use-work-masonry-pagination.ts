'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WORK_MASONRY_BATCH_SIZE } from '@/lib/work/masonry-pagination'

type UseWorkMasonryPaginationOptions<T> = {
  items: T[]
  batchSize?: number
}

export function useWorkMasonryPagination<T>({
  items,
  batchSize = WORK_MASONRY_BATCH_SIZE,
}: UseWorkMasonryPaginationOptions<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(batchSize, items.length),
  )

  useEffect(() => {
    setVisibleCount((prev) => Math.min(prev, items.length))
  }, [items.length])

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  )

  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + batchSize, items.length))
  }, [batchSize, items.length])

  useEffect(() => {
    if (!hasMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { root: null, rootMargin: '240px 0px 320px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore, visibleCount])

  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh(true))
  }, [visibleCount])

  return {
    sentinelRef,
    visibleItems,
    visibleCount,
    totalCount: items.length,
    hasMore,
    loadMore,
  }
}
