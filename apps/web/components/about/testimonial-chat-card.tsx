'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import * as fonts from '@/styles/fonts'
import TestimonialReadMoreModal from '@/components/about/testimonial-read-more-modal'
import { useIsTextClamped } from '@/hooks/use-is-text-clamped'
import type { AboutTestimonial } from '@/types/about-testimonial'

type TestimonialChatCardProps = {
  testimonial: AboutTestimonial
}

export default function TestimonialChatCard({
  testimonial,
}: TestimonialChatCardProps) {
  const quoteRef = useRef<HTMLParagraphElement>(null)
  const isClamped = useIsTextClamped(quoteRef)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const stopCarousel = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  return (
    <>
      <article className="flex h-full min-h-0 cursor-default flex-col rounded-[1.75rem] bg-white p-4 shadow-[0_8px_28px_rgba(57,65,154,0.07)] sm:rounded-[2rem] sm:p-5">
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
            {testimonial.jobTitle ? (
              <p
                className={`mt-0.5 truncate text-xs italic text-neutral-600 sm:mt-1 sm:text-sm ${fonts.bricolage_grot500.className}`}
              >
                {testimonial.jobTitle}
              </p>
            ) : null}
            <p
              className={`mt-0.5 truncate text-xs text-neutral-500 sm:text-sm ${fonts.bricolage_grot400.className}`}
            >
              {testimonial.company}
            </p>
          </div>
        </header>

        <div className="shrink-0 pt-3 sm:pt-4">
          <p
            ref={quoteRef}
            className={`line-clamp-4 max-w-[95%] text-[0.9rem] leading-relaxed text-neutral-700 sm:text-[0.95rem] sm:leading-relaxed lg:text-base ${fonts.bricolage_grot400.className}`}
          >
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          {isClamped ? (
            <button
              type="button"
              onClick={(event) => {
                stopCarousel(event)
                setIsModalOpen(true)
              }}
              onPointerDown={stopCarousel}
              className={`mt-2 cursor-pointer text-sm text-sanmarino transition hover:text-casablanca ${fonts.bricolage_grot600.className}`}
            >
              Read more
            </button>
          ) : null}
        </div>
      </article>

      <TestimonialReadMoreModal
        testimonial={testimonial}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
