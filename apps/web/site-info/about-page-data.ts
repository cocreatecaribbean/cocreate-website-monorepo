export const aboutPageTitle = {
  lineOne: 'About',
  lineTwo: 'CoCreate',
} as const

export const aboutHero = {
  imageSrc: '/about-hero.jpg',
  imageAlt: 'CoCreate team at work',
  heading: 'Empowering Brands',
  body: `Some clients come to us for a campaign. Others come for a rebrand, a product launch, public relations stories or a corporate transformation. The deliverables are different but our job is always the same:`,
  bodyHighlight: `helping people see your business the way it deserves to be seen.`,
  /** Tiny JPEG data URL for next/image blur placeholder (generated from about-hero.jpg). */
  imageBlurDataURL:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAQAAsDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgMF/8QAIBAAAQMFAQADAAAAAAAAAAAAAQIDEQAEEhMhMVGRwf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGBEAAwEBAAAAAAAAAAAAAAAAAAECESH/2gAMAwEAAhEDEQA/AM+7Q+WtTCY2FKuez+Vdq0c1Izwyjs+zQv1KBS/sSg+gZTJHzTN20elxwEiSAnk/dSpVnBxibVH/2Q==',
} as const

export const aboutServicesSection = {
  title: 'Our Strengths',
} as const

export type AboutService = {
  title: string
  description: string
  iconSrc: string
}

export const aboutServices: readonly AboutService[] = [
  {
    title: 'Branding',
    description:
      'Building cohesive visual identities that resonate with your audience.',
    iconSrc: '/about-page-icons/branding-icon.svg',
  },
  {
    title: 'Digital',
    description:
      'Developing high-performance, user-centric web and mobile experiences.',
    iconSrc: '/about-page-icons/digital-service-icon.svg',
  },
  {
    title: 'Production',
    description:
      'Capturing high-fidelity content that brings your brand story to life.',
    iconSrc: '/about-page-icons/production-icon.svg',
  },
  {
    title: 'PR & Comms.',
    description:
      'Amplifying your message through strategic storytelling and media relations.',
    iconSrc: '/about-page-icons/PR-icon.svg',
  },
  {
    title: 'Talent',
    description:
      'Connecting you with the top-tier creative and technical expertise your projects require.',
    iconSrc: '/about-page-icons/talent-icon.svg',
  },
  {
    title: 'Analytics',
    description:
      'Turning data into actionable insights for measurable growth.',
    iconSrc: '/about-page-icons/analytics-icon.svg',
  },
] as const
