import {
  aboutTestimonialsMock,
  aboutTestimonialsSection,
} from '@/site-info/about-testimonials.mock'
import type { AboutTestimonial } from '@/types/about-testimonial'

export type AboutTestimonialsContent = {
  section: typeof aboutTestimonialsSection
  testimonials: AboutTestimonial[]
}

/** v1: mock data. Replace with Sanity GROQ when testimonial schema is live. */
export async function fetchAboutTestimonials(): Promise<AboutTestimonialsContent> {
  const testimonials = [...aboutTestimonialsMock].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )

  return {
    section: aboutTestimonialsSection,
    testimonials,
  }
}
