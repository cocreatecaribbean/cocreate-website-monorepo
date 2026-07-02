'use client'

import { forwardRef } from 'react'

type ThreadScrollEndProps = {
  as?: 'div' | 'li'
}

export const ThreadScrollEnd = forwardRef<HTMLDivElement, ThreadScrollEndProps>(
  function ThreadScrollEnd({ as: Tag = 'div' }, ref) {
    return (
      <Tag
        ref={ref as never}
        aria-hidden
        data-thread-scroll-end
        className={`h-0 w-full shrink-0 scroll-mt-0 ${Tag === 'li' ? 'list-none' : ''}`}
      />
    )
  },
)
