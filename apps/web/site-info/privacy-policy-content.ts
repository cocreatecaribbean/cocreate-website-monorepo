export type PrivacyPolicySection = {
  id?: string
  title: string
  paragraphs: string[]
}

/**
 * Client-facing privacy copy for /privacy.
 * Portal messaging retention/access should stay accurate to product behavior.
 */
export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    paragraphs: [
      'CoCreate Caribbean (“CoCreate,” “we,” “us”) provides marketing and creative services, a public website, and authenticated Client Portal tools for project collaboration and support.',
      'This page explains how we handle information you share with us through our website and Client Portal. For questions about this policy, email requests@cocreatecaribbean.com.',
    ],
  },
  {
    id: 'portal-messaging',
    title: 'Client Portal messages and records',
    paragraphs: [
      'When you use the Client Portal, project conversations (including onboarding, project updates, and cancellation threads) and Get Help messages are stored in CoCreate systems so we can deliver work, provide support, and keep a shared record of what was discussed and decided.',
      'CoCreate administrators can access those threads as needed to work with your organization. Team members on your account see messages according to the permissions configured for their role (for example, Get Help access).',
      'Message history is retained for the life of your client engagement and account, unless removed under your contract with us or in response to a valid deletion or access request.',
      'Where the product provides it, clients and CoCreate admins can download AI thread summaries and full message transcripts (including optional date ranges) from project and Get Help conversations.',
      'To request access to, correction of, or deletion of portal messaging records, contact requests@cocreatecaribbean.com. We may need to verify your identity and account relationship before acting on a request.',
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
