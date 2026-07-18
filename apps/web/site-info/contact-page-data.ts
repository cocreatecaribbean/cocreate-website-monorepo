export const contactPageTitle = {
  lineOne: "Let's",
  lineTwo: 'CoCreate!',
} as const

export const contactPageHero = {
  subtitle: 'From anywhere in the world!',
  locationLead: "We're in",
  /** First entry is the default; the pill cycles these aliases. */
  locationNames: [
    'Jamaica!',
    'Jamdung!',
    'Jamrock!',
    'Land of Wood and Water',
    'Xamayca!',
  ],
  locationAsk: 'Where are you?',
} as const

export const contactInfo = {
  phone: '876.504.1240',
  phoneHref: 'tel:+18765041240',
  email: 'requests@cocreatecaribbean.com',
  region: 'Caribbean',
  blurb:
    'Tell us about your project, timeline, or question. We typically respond within one to two business days.',
} as const

/** Canonical inbox for website contact form deliveries. */
export const CONTACT_INBOX_EMAIL = 'requests@cocreatecaribbean.com' as const
