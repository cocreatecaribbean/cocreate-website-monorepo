export type PrivacyPolicySection = {
  id?: string
  title: string
  paragraphs: string[]
}

/**
 * Paste your Google Docs privacy policy copy here.
 * Each section becomes a heading + paragraphs on /privacy.
 */
export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    paragraphs: [
      'Replace this placeholder with your privacy policy text from Google Docs.',
      'Add one string per paragraph — each will render as its own block on the page.',
    ],
  },
]

export const COOKIE_POLICY_SECTION: PrivacyPolicySection = {
  id: 'cookies',
  title: 'Cookies',
  paragraphs: [
    'This site uses essential cookies required for basic operation, such as remembering your cookie preference.',
    'We store your choice in a first-party cookie named cc_cookie_consent for up to 12 months.',
    'If you accept optional cookies, we may load analytics tools that help us understand how visitors use the site. These are not loaded unless you choose Accept.',
    'If you reject non-essential cookies, the site continues to work normally without optional analytics.',
    'You can remove or block cookies anytime through your browser settings. Clearing cookies may show this notice again on your next visit.',
  ],
}
