export const aboutPageTitle = {
  lineOne: 'About',
  lineTwo: 'CoCreate',
} as const

export const aboutHero = {
  imageSrc: '/about-hero.jpg',
  imageAlt: 'CoCreate team at work',
  heading: 'Empowering Brands',
  body: `COCREATE Caribbean bridges the gap between Caribbean brands and their audiences through strategic storytelling, innovative design, and immersive digital experiences. From motion graphics that simplify complex ideas to web platforms that foster real engagement, we blend technical expertise with a deep understanding of the market to help businesses shine in their industries.`,
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
