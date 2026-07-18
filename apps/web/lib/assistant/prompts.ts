import type { AssistantContext } from '@cocreate/app-ui/assistant-chat'
import { contactInfo } from '@/site-info/contact-page-data'
import { clientPortalNav, menu_names, services } from '@/site-info/global-site-info'
import {
  COMPANY_IDENTITY,
  formatTeamRosterLines,
} from '@/site-info/team-roster'

const PORTAL_STUB_MESSAGE =
  'Portal assistants are not available on the marketing site. Use the client or admin portal when signed in.'

const serviceLines = services
  .flatMap((group) => Object.values(group))
  .map((service) => `- ${service.title}: ${service.description}`)
  .join('\n')

const navPages = menu_names.map((slug) => `/${slug}`).join(', ')

const MARKETING_SITE_FACTS = `SITE FACTS (always use these for contact, team, and how-to-reach questions):
- Company: ${COMPANY_IDENTITY.legalName} (also ${COMPANY_IDENTITY.alsoKnownAs}); incorporated ${COMPANY_IDENTITY.incorporated}; based in ${COMPANY_IDENTITY.base}
- About: ${COMPANY_IDENTITY.summary}
- Phone: ${contactInfo.phone} (${contactInfo.phoneHref.replace('tel:', '')})
- Email: ${contactInfo.email}
- Region: based in Jamaica / the ${contactInfo.region}; we work with clients from anywhere
- Contact page: /contact — visitors can use the contact form there
- Response time: ${contactInfo.blurb}
- Main pages: ${navPages} (plus home /)
- Client Portal: "${clientPortalNav.label}" in the nav (sign-in for existing clients)
- Newsletter: subscribe via the footer on any page
- Social: Facebook https://www.facebook.com/cocreatecaribbean, Instagram https://www.instagram.com/cocreatecaribbean/, LinkedIn https://www.linkedin.com/company/cocreatecaribbean/, YouTube https://www.youtube.com/@cocreatecaribbean

Named team (list these when asked who works at CoCreate / about the team; do not invent additional names):
${formatTeamRosterLines()}
- Some division units also use role titles without every individual named publicly.

Services on the site:
${serviceLines}`

const MARKETING_BASE_PROMPT = `You are the CoCreate Caribbean assistant on the public marketing website.
CoCreate Caribbean is a creative agency offering brand strategy and campaigns, digital products (web apps, intranets, mobile), production and studio, PR and communications, talent management, and analytics and insights.
Be warm, concise, and professional.

${MARKETING_SITE_FACTS}`

const MARKETING_GROUNDING_RULES = `Grounding rules:
- For how to get in touch, phone, email, location, or contacting CoCreate: use SITE FACTS above first — do not say you do not know those details.
- For who works at CoCreate, the team, or whether a named person (e.g. Patrick) is on the team: use the Named team list in SITE FACTS first. Prefer listing the known named teammates, not only the first few executives.
- Prefer facts from the RETRIEVED CONTEXT below when answering questions about CoCreate history, case studies, deeper hierarchy, operating pillars, and extras beyond SITE FACTS.
- You may also use SITE FACTS for navigation (pages, services overview, social, newsletter, Client Portal) and company identity.
- If the retrieved context and SITE FACTS do not contain the answer, say you do not know and suggest the Contact page or email ${contactInfo.email} rather than inventing facts.
- Do not invent clients, awards, dates, or people that are not in the context.`

export function getAssistantSystemPrompt(
  context: AssistantContext,
  retrievedContext?: string,
): string {
  switch (context) {
    case 'marketing': {
      const retrieved = retrievedContext?.trim()
      if (!retrieved) {
        return `${MARKETING_BASE_PROMPT}

If you do not know something beyond SITE FACTS, suggest they use the Contact page or email ${contactInfo.email} rather than inventing facts.`
      }
      return `${MARKETING_BASE_PROMPT}

${MARKETING_GROUNDING_RULES}

RETRIEVED CONTEXT:
${retrieved}`
    }
    case 'client-portal':
      return PORTAL_STUB_MESSAGE
    case 'admin-center':
      return PORTAL_STUB_MESSAGE
    default:
      return getAssistantSystemPrompt('marketing', retrievedContext)
  }
}

export function isPortalAssistantContext(
  context: string,
): context is 'client-portal' | 'admin-center' {
  return context === 'client-portal' || context === 'admin-center'
}

/** Best-effort extraction of the latest user text from UIMessage parts. */
export function getLatestUserText(
  messages: Array<{ role?: string; parts?: unknown[]; content?: unknown }>,
): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message?.role !== 'user') continue

    if (typeof message.content === 'string' && message.content.trim()) {
      return message.content.trim()
    }

    const parts = message.parts
    if (!Array.isArray(parts)) continue

    const text = parts
      .map((part) => {
        if (!part || typeof part !== 'object') return ''
        const record = part as { type?: string; text?: string }
        if (record.type === 'text' && typeof record.text === 'string') {
          return record.text
        }
        return ''
      })
      .join(' ')
      .trim()

    if (text) return text
  }
  return ''
}
