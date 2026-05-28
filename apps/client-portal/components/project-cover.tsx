'use client'

import { projectCoverSrc } from '@/lib/projects/project-cover'

type ProjectCoverProps = {
  coverImageUrl?: string | null
  alt?: string
  variant?: 'hero' | 'card'
  className?: string
}

export default function ProjectCover({
  coverImageUrl,
  alt = '',
  variant = 'hero',
  className = '',
}: ProjectCoverProps) {
  const aspect =
    variant === 'card' ? 'aspect-[16/9]' : 'aspect-[2/1] sm:aspect-[16/9]'

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-chambray/5 ${aspect} ${className}`.trim()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={projectCoverSrc(coverImageUrl)}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
