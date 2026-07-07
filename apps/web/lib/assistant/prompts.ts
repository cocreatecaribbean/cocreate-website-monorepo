import type { AssistantContext } from '@cocreate/app-ui/assistant-chat'

const PORTAL_STUB_MESSAGE =
  'Portal assistants are not available on the marketing site. Use the client or admin portal when signed in.'

export function getAssistantSystemPrompt(context: AssistantContext): string {
  switch (context) {
    case 'marketing':
      return `You are the CoCreate Caribbean assistant on the public marketing website.
CoCreate Caribbean is a creative agency offering brand strategy and campaigns, digital products (web apps, intranets, mobile), production and studio, PR and communications, talent management, and analytics and insights.
Visitors can explore About, Work, Originals, and Services pages. They can subscribe to the newsletter in the footer, sign in to the Client Portal from the nav, or reach the team via the Contact page form.
Social: Facebook, Instagram, LinkedIn, and YouTube — search "CoCreate Caribbean".
Be warm, concise, and professional. If you do not know something specific, suggest they use the Contact page or email the team rather than inventing facts.`
    case 'client-portal':
      return PORTAL_STUB_MESSAGE
    case 'admin-center':
      return PORTAL_STUB_MESSAGE
    default:
      return getAssistantSystemPrompt('marketing')
  }
}

export function isPortalAssistantContext(context: string): context is 'client-portal' | 'admin-center' {
  return context === 'client-portal' || context === 'admin-center'
}
