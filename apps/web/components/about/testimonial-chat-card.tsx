'use client'

import Image from 'next/image'
import * as fonts from '@/styles/fonts'
import type { AboutTestimonial } from '@/types/about-testimonial'

type TestimonialChatCardProps = {
  testimonial: AboutTestimonial
}

export default function TestimonialChatCard({
  testimonial,
}: TestimonialChatCardProps) {
  return (
    <article className="flex h-full min-h-0 flex-col rounded-[1.75rem] bg-white p-4 shadow-[0_8px_28px_rgba(57,65,154,0.07)] sm:rounded-[2rem] sm:p-5">
      <header className="flex min-h-0 flex-1 items-center gap-3 border-b border-chambray/8 pb-3 sm:gap-4 sm:pb-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md sm:h-[4.75rem] sm:w-[4.75rem] lg:h-20 lg:w-20">
          <Image
            src={testimonial.photoUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 64px, (max-width: 1024px) 76px, 80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[0.9375rem] text-neutral-900 sm:text-base lg:text-[1.05rem] ${fonts.bricolage_grot700.className}`}
          >
            {testimonial.name}
          </p>
          <p
            className={`mt-0.5 truncate text-xs text-neutral-500 sm:mt-1 sm:text-sm ${fonts.bricolage_grot400.className}`}
          >
            {testimonial.company}
          </p>
        </div>
      </header>

      <div className="shrink-0 pt-3 sm:pt-4">
        <p
          className={`line-clamp-4 max-w-[95%] text-[0.9rem] leading-relaxed text-neutral-700 sm:text-[0.95rem] sm:leading-relaxed lg:text-base ${fonts.bricolage_grot400.className}`}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>
    </article>
  )
}
