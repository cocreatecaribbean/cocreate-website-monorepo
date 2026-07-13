import type { AboutTestimonial } from '@/types/about-testimonial'

export const aboutTestimonialsSection = {
  eyebrow: 'Testimonials',
  title: 'What Clients Say',
  description:
    'Real feedback from partners who trust CoCreate to shape how their brands show up online and in the room.',
} as const

export const aboutTestimonialsMock: readonly AboutTestimonial[] = [
  {
    id: 't1',
    name: 'Marcia Clarke',
    company: 'Island Fresh Markets',
    quote:
      'CoCreate turned our scattered social presence into a cohesive story. The team listens, moves fast, and the work always feels unmistakably us. From campaign concepts to final delivery, every touchpoint reflected our values and resonated with the communities we serve. They became true partners in how we show up online and in the room.',
    photoUrl: '/about-hero.jpg',
    sortOrder: 1,
  },
  {
    id: 't2',
    name: 'David Singh',
    company: 'Harbourview Financial',
    quote:
      'From brand refresh to campaign rollout, they delivered polish without losing warmth. Our audience engagement jumped within the first quarter.',
    photoUrl: '/strategic-bg.jpg',
    sortOrder: 2,
  },
  {
    id: 't3',
    name: 'Aisha Williams',
    company: 'Pulse Caribbean Media',
    quote:
      'The motion work alone was worth it — complex ideas became clear, shareable stories. CoCreate feels like an extension of our in-house team.',
    photoUrl: '/about-hero.jpg',
    sortOrder: 3,
  },
  {
    id: 't4',
    name: 'Ryan Baptiste',
    company: 'Blue Horizon Resorts',
    quote:
      'They balanced luxury positioning with authentic Caribbean voice. Every deliverable was on-brand and ready for our sales team to use immediately.',
    photoUrl: '/strategic-bg.jpg',
    sortOrder: 4,
  },
  {
    id: 't5',
    name: 'Keisha Morgan',
    company: 'NextGen Edu Foundation',
    quote:
      'CoCreate helped us reach younger audiences without dumbing down our mission. Thoughtful strategy, beautiful design, measurable results.',
    photoUrl: '/about-hero.jpg',
    sortOrder: 5,
  },
  {
    id: 't6',
    name: 'James Porter',
    company: 'Summit Logistics Group',
    quote:
      'Professional from kickoff to launch. They kept us in the loop, hit every milestone, and the new site finally reflects the scale of our operation.',
    photoUrl: '/strategic-bg.jpg',
    sortOrder: 6,
  },
] as const
